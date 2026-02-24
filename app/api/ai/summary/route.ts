import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchAllJira, searchJira, getUsers } from '@/lib/jira';
import {
    generateExecutiveSummary,
    type AISummaryRequest,
    type EpicData,
    type BugData,
    type WorkloadData,
    type TaskData,
    type GeminiModel,
} from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const projectKey = body.projectKey;
        const model: GeminiModel | undefined = body.model;
        const language: "vi" | "en" = body.language || "vi";

        if (!projectKey) {
            return NextResponse.json({ error: 'projectKey is required' }, { status: 400 });
        }

        // Fetch all data in parallel
        const projectFilter = `project = "${projectKey}"`;

        const [epicResult, bugsResult, overdueResult, worklogResult] = await Promise.all([
            // 1. Get all issues grouped by Epic
            searchAllJira(
                `${projectFilter} AND "Epic Link" is not EMPTY ORDER BY "Epic Link"`,
                {
                    fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'customfield_10014'],
                    maxResults: 500,
                    accessToken,
                    cloudId,
                }
            ).catch(() => ({ issues: [] })),

            // 2. Critical/High bugs unresolved
            searchAllJira(
                `${projectFilter} AND issuetype = Bug AND priority in (High, Highest, Critical) AND resolution = Unresolved ORDER BY priority DESC, created ASC`,
                {
                    fields: ['summary', 'priority', 'assignee', 'created', 'status'],
                    maxResults: 20,
                    accessToken,
                    cloudId,
                }
            ).catch(() => ({ issues: [] })),

            // 3. Overdue tasks
            searchAllJira(
                `${projectFilter} AND duedate < now() AND resolution = Unresolved ORDER BY duedate ASC`,
                {
                    fields: ['summary', 'assignee', 'duedate', 'status'],
                    maxResults: 20,
                    accessToken,
                    cloudId,
                }
            ).catch(() => ({ issues: [] })),

            // 4. Recent worklogs (last 14 days) for workload
            searchAllJira(
                `${projectFilter} AND worklogDate >= -14d`,
                {
                    fields: ['worklog', 'assignee', 'status', 'summary'],
                    maxResults: 200,
                    accessToken,
                    cloudId,
                }
            ).catch(() => ({ issues: [] })),
        ]);

        // Also try to get Epics directly
        let epicsList: any[] = [];
        try {
            const epicsDirectResult = await searchAllJira(
                `${projectFilter} AND issuetype = Epic ORDER BY rank`,
                {
                    fields: ['summary', 'status'],
                    maxResults: 50,
                    accessToken,
                    cloudId,
                }
            );
            epicsList = epicsDirectResult.issues || [];
        } catch {
            // Epic type might not exist in this project
        }

        // Process Epic data
        const epicMap: Record<string, EpicData> = {};
        const epicIssues = epicResult.issues || [];

        // Initialize epics from direct query
        epicsList.forEach((epic: any) => {
            epicMap[epic.key] = {
                name: epic.fields.summary || epic.key,
                key: epic.key,
                totalTasks: 0,
                doneTasks: 0,
                inProgressTasks: 0,
                todoTasks: 0,
                blockerCount: 0,
            };
        });

        // Count tasks per epic
        epicIssues.forEach((issue: any) => {
            const epicKey = issue.fields.customfield_10014; // Epic Link field
            if (!epicKey) return;

            if (!epicMap[epicKey]) {
                epicMap[epicKey] = {
                    name: epicKey,
                    key: epicKey,
                    totalTasks: 0,
                    doneTasks: 0,
                    inProgressTasks: 0,
                    todoTasks: 0,
                    blockerCount: 0,
                };
            }

            const epic = epicMap[epicKey];
            epic.totalTasks++;

            const statusCategory = issue.fields.status?.statusCategory?.key;
            if (statusCategory === 'done') {
                epic.doneTasks++;
            } else if (statusCategory === 'indeterminate') {
                epic.inProgressTasks++;
            } else {
                epic.todoTasks++;
            }

            const priority = issue.fields.priority?.name?.toLowerCase();
            if (priority === 'blocker' || priority === 'highest') {
                epic.blockerCount++;
            }
        });

        // Process Critical Bugs
        const criticalBugs: BugData[] = (bugsResult.issues || []).map((issue: any) => ({
            key: issue.key,
            summary: issue.fields.summary,
            priority: issue.fields.priority?.name || 'Unknown',
            assignee: issue.fields.assignee?.displayName || null,
            created: new Date(issue.fields.created).toLocaleDateString(),
            status: issue.fields.status?.name || 'Unknown',
        }));

        // Process Overdue Tasks
        const now = new Date();
        const overdueTasks: TaskData[] = (overdueResult.issues || []).map((issue: any) => {
            const dueDate = new Date(issue.fields.duedate);
            const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
                key: issue.key,
                summary: issue.fields.summary,
                assignee: issue.fields.assignee?.displayName || null,
                dueDate: issue.fields.duedate,
                status: issue.fields.status?.name || 'Unknown',
                daysOverdue: diffDays,
            };
        });

        // Process Workload
        const workloadMap: Record<string, WorkloadData> = {};
        const worklogIssues = worklogResult.issues || [];

        worklogIssues.forEach((issue: any) => {
            const assigneeName = issue.fields.assignee?.displayName;
            if (!assigneeName) return;

            if (!workloadMap[assigneeName]) {
                workloadMap[assigneeName] = {
                    memberName: assigneeName,
                    assignedTasks: 0,
                    completedTasks: 0,
                    hoursLogged: 0,
                };
            }

            workloadMap[assigneeName].assignedTasks++;
            if (issue.fields.status?.statusCategory?.key === 'done') {
                workloadMap[assigneeName].completedTasks++;
            }

            // Sum worklogs
            const worklogs = issue.fields.worklog?.worklogs || [];
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            worklogs.forEach((log: any) => {
                const logDate = new Date(log.started);
                if (logDate >= twoWeeksAgo) {
                    const authorName = log.author?.displayName;
                    if (authorName && workloadMap[authorName]) {
                        workloadMap[authorName].hoursLogged += Math.round((log.timeSpentSeconds || 0) / 3600 * 10) / 10;
                    }
                }
            });
        });

        // Build the AI request
        const projectName = projectKey; // We could fetch project name but key is sufficient
        const aiRequest: AISummaryRequest = {
            projectData: {
                projectName,
                epics: Object.values(epicMap),
                criticalBugs,
                teamWorkload: Object.values(workloadMap),
                overdueTasks,
            },
            model,
            language,
        };

        // Generate AI Summary
        const summary = await generateExecutiveSummary(aiRequest);

        return NextResponse.json({
            summary,
            metadata: {
                projectKey,
                generatedAt: new Date().toISOString(),
                model: model || "gemini-2.5-flash",
                dataPoints: {
                    epics: Object.keys(epicMap).length,
                    criticalBugs: criticalBugs.length,
                    overdueTasks: overdueTasks.length,
                    teamMembers: Object.keys(workloadMap).length,
                },
            },
        });
    } catch (error: any) {
        console.error("AI Summary Error:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate AI summary' },
            { status: 500 }
        );
    }
}
