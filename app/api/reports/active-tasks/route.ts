import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchAllJira } from '@/lib/jira';

export interface ActiveTask {
    issueKey: string;
    summary: string;
    project: {
        key: string;
        name: string;
        avatarUrl?: string;
    };
    issueType: {
        name: string;
        iconUrl?: string;
    };
    status: {
        name: string;
        category: string;
        colorName: string;
    };
    priority: {
        name: string;
        iconUrl?: string;
    };
    assignee: {
        accountId: string;
        displayName: string;
        avatarUrl?: string;
    };
    updatedAt: string;
    dueDate?: string;
    timeInStatus?: number; // hours since last status change
}

export interface ActiveTasksInsights {
    totalTasks: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byProject: Record<string, number>;
    byAssignee: Record<string, { count: number; displayName: string; avatarUrl?: string }>;
    overdueTasks: number;
    highPriorityTasks: number;
    avgTimeInStatus: number; // hours
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectKey = searchParams.get('projectKey');
        const userId = searchParams.get('userId');
        const includeInsights = searchParams.get('includeInsights') === 'true';

        // Build JQL to fetch issues that are currently in progress and assigned
        let jql = `statusCategory = "In Progress" AND assignee IS NOT EMPTY`;

        if (projectKey && projectKey !== 'all') {
            jql += ` AND project = "${projectKey}"`;
        }

        // Filter by specific user if provided
        if (userId && userId !== 'all') {
            jql += ` AND assignee = "${userId}"`;
        }

        // Fetch issues with necessary fields including priority and duedate
        const data = await searchAllJira(jql, {
            accessToken,
            cloudId,
            fields: ['summary', 'status', 'assignee', 'project', 'issuetype', 'updated', 'priority', 'duedate', 'statuscategorychangedate'],
            maxResults: 200
        });

        const issues = data.issues || [];
        const now = new Date();

        // Format and group data by assignee
        const activeTasks: ActiveTask[] = issues.map((issue: any) => {
            const assignee = issue.fields.assignee;
            const status = issue.fields.status;
            const priority = issue.fields.priority;
            const dueDate = issue.fields.duedate;
            const statusChangeDate = issue.fields.statuscategorychangedate;

            // Calculate time in current status (hours)
            let timeInStatus = 0;
            if (statusChangeDate) {
                const changeTime = new Date(statusChangeDate).getTime();
                timeInStatus = Math.round((now.getTime() - changeTime) / (1000 * 60 * 60));
            }

            return {
                issueKey: issue.key,
                summary: issue.fields.summary,
                project: {
                    key: issue.fields.project.key,
                    name: issue.fields.project.name,
                    avatarUrl: issue.fields.project.avatarUrls?.['48x48']
                },
                issueType: {
                    name: issue.fields.issuetype.name,
                    iconUrl: issue.fields.issuetype.iconUrl
                },
                status: {
                    name: status.name,
                    category: status.statusCategory.name,
                    colorName: status.statusCategory.colorName
                },
                priority: {
                    name: priority?.name || 'Medium',
                    iconUrl: priority?.iconUrl
                },
                assignee: {
                    accountId: assignee.accountId,
                    displayName: assignee.displayName,
                    avatarUrl: assignee.avatarUrls?.['48x48']
                },
                updatedAt: issue.fields.updated,
                dueDate: dueDate || undefined,
                timeInStatus
            };
        });

        // Generate insights if requested
        let insights: ActiveTasksInsights | undefined;
        if (includeInsights) {
            const byStatus: Record<string, number> = {};
            const byPriority: Record<string, number> = {};
            const byProject: Record<string, number> = {};
            const byAssignee: Record<string, { count: number; displayName: string; avatarUrl?: string }> = {};
            let overdueTasks = 0;
            let highPriorityTasks = 0;
            let totalTimeInStatus = 0;

            activeTasks.forEach(task => {
                // By status
                byStatus[task.status.name] = (byStatus[task.status.name] || 0) + 1;

                // By priority
                byPriority[task.priority.name] = (byPriority[task.priority.name] || 0) + 1;

                // By project
                byProject[task.project.key] = (byProject[task.project.key] || 0) + 1;

                // By assignee
                if (!byAssignee[task.assignee.accountId]) {
                    byAssignee[task.assignee.accountId] = {
                        count: 0,
                        displayName: task.assignee.displayName,
                        avatarUrl: task.assignee.avatarUrl
                    };
                }
                byAssignee[task.assignee.accountId].count++;

                // Overdue check
                if (task.dueDate && new Date(task.dueDate) < now) {
                    overdueTasks++;
                }

                // High priority check
                if (['Highest', 'High', 'Critical', 'Blocker'].includes(task.priority.name)) {
                    highPriorityTasks++;
                }

                // Time in status
                totalTimeInStatus += task.timeInStatus || 0;
            });

            insights = {
                totalTasks: activeTasks.length,
                byStatus,
                byPriority,
                byProject,
                byAssignee,
                overdueTasks,
                highPriorityTasks,
                avgTimeInStatus: activeTasks.length > 0 ? Math.round(totalTimeInStatus / activeTasks.length) : 0
            };
        }

        // Generate a response structure
        return NextResponse.json({
            count: activeTasks.length,
            tasks: activeTasks,
            insights,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Active Tasks API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch active tasks' },
            { status: 500 }
        );
    }
}
