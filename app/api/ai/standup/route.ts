import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchAllJira } from '@/lib/jira';
import {
    generateStandupReport,
    type StandupRequest,
    type StandupWorklog,
    type StandupStatusChange,
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
        const { userId, userName, projectKey, model, language } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const authOptions_jira = { accessToken, cloudId };

        // Get worklogs from last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Fetch issues updated by this user recently
        let jql = `worklogAuthor = "${userId}" AND worklogDate >= "${yesterdayStr}"`;
        if (projectKey && projectKey !== 'all') {
            jql += ` AND project = "${projectKey}"`;
        }
        jql += ` ORDER BY updated DESC`;

        const worklogData = await searchAllJira(jql, {
            ...authOptions_jira,
            fields: ['summary', 'status', 'issuetype', 'worklog', 'assignee', 'priority'],
            maxResults: 50,
        });

        // Parse worklogs for this user in last 24h  
        const worklogs: StandupWorklog[] = [];
        const statusChanges: StandupStatusChange[] = [];

        for (const issue of (worklogData.issues || [])) {
            const fields = issue.fields;
            const issueKey = issue.key;
            const issueSummary = fields.summary;
            const issueType = fields.issuetype?.name || 'Task';

            // Extract worklogs
            const issueWorklogs = fields.worklog?.worklogs || [];
            for (const wl of issueWorklogs) {
                const authorId = wl.author?.accountId || wl.author?.name || '';
                const started = wl.started?.split('T')[0] || '';
                if (authorId === userId && started >= yesterdayStr) {
                    worklogs.push({
                        issueKey,
                        issueSummary,
                        issueType,
                        timeSpent: wl.timeSpent || '0h',
                        date: started,
                    });
                }
            }
        }

        // Also fetch status transitions (issues that changed status recently)
        let transitionJql = `assignee = "${userId}" AND status CHANGED AFTER "${yesterdayStr}"`;
        if (projectKey && projectKey !== 'all') {
            transitionJql += ` AND project = "${projectKey}"`;
        }
        transitionJql += ` ORDER BY updated DESC`;

        try {
            const transitionData = await searchAllJira(transitionJql, {
                ...authOptions_jira,
                fields: ['summary', 'status', 'issuetype'],
                expand: ['changelog'],
                maxResults: 30,
            });

            for (const issue of (transitionData.issues || [])) {
                const fields = issue.fields;
                const changelog = issue.changelog;
                if (!changelog?.histories) continue;

                for (const history of changelog.histories) {
                    const historyDate = history.created?.split('T')[0] || '';
                    if (historyDate < yesterdayStr) continue;

                    for (const item of (history.items || [])) {
                        if (item.field === 'status') {
                            statusChanges.push({
                                issueKey: issue.key,
                                issueSummary: fields.summary,
                                issueType: fields.issuetype?.name || 'Task',
                                fromStatus: item.fromString || '',
                                toStatus: item.toString || '',
                                date: historyDate,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            // Status change query may fail on some Jira configs, continue without it
            console.warn('Could not fetch status changes:', e);
        }

        // Generate standup via AI
        const standupRequest: StandupRequest = {
            memberName: userName || userId,
            worklogs,
            statusChanges,
            model: model as GeminiModel,
            language: language || 'vi',
        };

        const standup = await generateStandupReport(standupRequest);

        return NextResponse.json({
            standup,
            metadata: {
                userId,
                generatedAt: new Date().toISOString(),
                model: model || 'gemini-2.5-flash',
                dataPoints: {
                    worklogs: worklogs.length,
                    statusChanges: statusChanges.length,
                },
            },
        });
    } catch (error: any) {
        console.error('Standup API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate standup report' },
            { status: 500 }
        );
    }
}
