
import { NextResponse } from 'next/server';
import { getJiraClient, searchJira } from '@/lib/jira';

export async function POST(request: Request) {
    try {
        const { startDate, endDate, projectIds, authorIds } = await request.json();

        // 1. Build JQL to find candidates
        // We look for issues updated in the range, because a worklog add updates the issue.
        // This isn't perfect (an issue could be updated for other reasons), but it's the best proxy without dedicated addon APIs.
        let jql = `updated >= "${startDate}"`;
        if (endDate) {
            jql += ` AND updated <= "${endDate}"`;
        }

        if (projectIds && projectIds.length > 0) {
            // Assume projectIds are Keys or IDs
            jql += ` AND project in (${projectIds.join(',')})`;
        }

        // We don't filter by author here because JQL 'worklogAuthor' is not always available/reliable for history.
        // But 'worklogAuthor' is standard JQL. Let's try to use it if provided to narrow down.
        if (authorIds && authorIds.length > 0) {
            jql += ` AND worklogAuthor in (${authorIds.map((id: string) => `"${id}"`).join(',')})`;
        }

        // 2. Search Issues
        const results = await searchJira(jql, {
            maxResults: 1000, // Limit to 1000 for safety
            fields: ['worklog', 'summary', 'project', 'issuetype']
        });

        const issues = results.issues || [];
        let allWorklogs: any[] = [];

        // 3. Process Worklogs
        // The search result 'worklog' field contains a 'worklogs' array.
        // However, it is paginated (max 20). If total > 20, we might miss some.
        // For MVP, we assume < 20 per issue in the period, or we rely on what's returned.
        // To be robust, if worklog.total > worklog.maxResults, we should fetch individual issue details.
        // For now, we use what is returned.

        const _startDate = new Date(startDate);
        const _endDate = endDate ? new Date(endDate) : new Date();

        issues.forEach((issue: any) => {
            const issueWorklogs = issue.fields.worklog?.worklogs || [];
            issueWorklogs.forEach((log: any) => {
                const started = new Date(log.started);
                // Check date range
                if (started >= _startDate && started <= _endDate) {
                    // Check author if specified
                    if (authorIds && authorIds.length > 0) {
                        // log.author.accountId or log.author.name
                        // We match broadly
                        const authorId = log.author?.accountId || log.author?.name;
                        if (!authorIds.includes(authorId)) return;
                    }

                    allWorklogs.push({
                        ...log,
                        issueId: issue.id,
                        issueKey: issue.key,
                        project: issue.fields.project
                    });
                }
            });
        });

        return NextResponse.json({
            total: allWorklogs.length,
            worklogs: allWorklogs
        });

    } catch (error: any) {
        console.error("Error fetching worklogs:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch worklogs' }, { status: 500 });
    }
}
