import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateTeamInsights, GeminiModel } from '@/lib/ai';
import { searchAllJira } from '@/lib/jira';

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

        const { projectKey, startDate, endDate, model, language } = await request.json();

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
        }

        // Fetch completed issues in date range
        let jql = `status changed to Done during ("${startDate}", "${endDate}")`;
        if (projectKey && projectKey !== 'all') {
            jql += ` AND project = "${projectKey}"`;
        }

        const issuesData = await searchAllJira(jql, {
            accessToken,
            cloudId,
            fields: ['assignee', 'timespent', 'resolutiondate', 'created', 'status', 'issuetype'],
            maxResults: 500,
        });

        const issues = issuesData.issues || [];

        // Fetch reopened issues to calculate reopens
        let reopenJql = `status changed from Done during ("${startDate}", "${endDate}")`;
        if (projectKey && projectKey !== 'all') {
            reopenJql += ` AND project = "${projectKey}"`;
        }

        const reopenData = await searchAllJira(reopenJql, {
            accessToken,
            cloudId,
            fields: ['assignee'],
            maxResults: 500,
        });

        const reopenedIssues = reopenData.issues || [];

        // Group by assignee
        const memberMap = new Map<string, {
            name: string;
            role: string;
            issuesCompleted: number;
            hoursLogged: number;
            totalCycleTime: number;
            cycleTimeCount: number;
            reopenCount: number;
        }>();

        // Count completed issues per member
        issues.forEach((issue: any) => {
            const assignee = issue.fields.assignee;
            if (!assignee) return;

            const userId = assignee.accountId;
            if (!memberMap.has(userId)) {
                memberMap.set(userId, {
                    name: assignee.displayName,
                    role: detectRole(issue.fields.issuetype?.name),
                    issuesCompleted: 0,
                    hoursLogged: 0,
                    totalCycleTime: 0,
                    cycleTimeCount: 0,
                    reopenCount: 0,
                });
            }

            const member = memberMap.get(userId)!;
            member.issuesCompleted++;
            member.hoursLogged += (issue.fields.timespent || 0) / 3600;

            // Calculate cycle time
            if (issue.fields.created && issue.fields.resolutiondate) {
                const created = new Date(issue.fields.created).getTime();
                const resolved = new Date(issue.fields.resolutiondate).getTime();
                member.totalCycleTime += (resolved - created) / (1000 * 60 * 60);
                member.cycleTimeCount++;
            }
        });

        // Count reopens per member
        reopenedIssues.forEach((issue: any) => {
            const assignee = issue.fields.assignee;
            if (!assignee) return;

            const member = memberMap.get(assignee.accountId);
            if (member) {
                member.reopenCount++;
            }
        });

        // Calculate metrics
        const members = Array.from(memberMap.values()).map(m => ({
            name: m.name,
            role: m.role,
            issuesCompleted: m.issuesCompleted,
            hoursLogged: Math.round(m.hoursLogged * 10) / 10,
            avgCycleTimeHours: m.cycleTimeCount > 0
                ? Math.round(m.totalCycleTime / m.cycleTimeCount * 10) / 10
                : 0,
            firstTimePassRate: m.issuesCompleted > 0
                ? Math.round(((m.issuesCompleted - m.reopenCount) / m.issuesCompleted) * 100)
                : 100,
            reopenCount: m.reopenCount,
        }));

        if (members.length === 0) {
            return NextResponse.json({
                error: 'No team data found for the specified period',
            }, { status: 404 });
        }

        // Calculate team averages
        const teamAverages = {
            issuesCompleted: Math.round(members.reduce((s, m) => s + m.issuesCompleted, 0) / members.length),
            hoursLogged: Math.round(members.reduce((s, m) => s + m.hoursLogged, 0) / members.length * 10) / 10,
            avgCycleTimeHours: Math.round(members.reduce((s, m) => s + m.avgCycleTimeHours, 0) / members.length * 10) / 10,
            firstTimePassRate: Math.round(members.reduce((s, m) => s + m.firstTimePassRate, 0) / members.length),
        };

        // Identify highlights
        const sortedByIssues = [...members].sort((a, b) => b.issuesCompleted - a.issuesCompleted);
        const sortedByPassRate = [...members].sort((a, b) => b.firstTimePassRate - a.firstTimePassRate);
        const sortedByWorkload = [...members].sort((a, b) => b.hoursLogged - a.hoursLogged);
        const sortedByReopens = [...members].sort((a, b) => b.reopenCount - a.reopenCount);

        const highlights = {
            topPerformer: sortedByIssues[0]?.name || 'N/A',
            mostImproved: sortedByPassRate[0]?.name || 'N/A',
            highestWorkload: sortedByWorkload[0]?.name || 'N/A',
            mostReopens: sortedByReopens[0]?.reopenCount > 0 ? sortedByReopens[0].name : 'None',
        };

        // Get project name
        let projectName = 'All Projects';
        if (projectKey && projectKey !== 'all') {
            try {
                const projRes = await fetch(
                    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${projectKey}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Accept': 'application/json',
                        },
                    }
                );
                if (projRes.ok) {
                    const projData = await projRes.json();
                    projectName = projData.name;
                }
            } catch {
                projectName = projectKey;
            }
        }

        // Generate AI insights
        const insights = await generateTeamInsights({
            teamData: {
                projectName,
                dateRange: { start: startDate, end: endDate },
                members,
                teamAverages,
                highlights,
            },
            model: model as GeminiModel,
            language: language || 'vi',
        });

        return NextResponse.json({
            insights,
            data: {
                members,
                teamAverages,
                highlights,
            },
            metadata: {
                projectKey: projectKey || 'all',
                projectName,
                dateRange: { start: startDate, end: endDate },
                model: model || 'gemini-2.5-flash',
                language: language || 'vi',
                totalMembers: members.length,
                totalIssues: issues.length,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('Team Insights API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate team insights' },
            { status: 500 }
        );
    }
}

// Helper to detect role based on issue type
function detectRole(issueType: string): string {
    const type = (issueType || '').toLowerCase();
    if (type.includes('bug') || type.includes('test') || type.includes('qa')) {
        return 'QC';
    }
    if (type.includes('review') || type.includes('lead')) {
        return 'Tech Lead';
    }
    return 'Developer';
}
