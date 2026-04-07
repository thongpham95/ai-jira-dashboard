import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchAllJira } from '@/lib/jira';
import { withCache, createCacheKey, CACHE_TTL } from '@/lib/cache';

interface TeamMemberStats {
    userId: string;
    userName: string;
    avatarUrl?: string;
    metrics: {
        issuesCompleted: number;
        hoursLogged: number;
        avgCycleTimeHours: number;
        punctuality: number;
        qualityScore: number;
    };
}

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

        const { projectKey, startDate, endDate } = await request.json();

        // Use cache for team comparison data
        const cacheKey = createCacheKey('team-comparison', { cloudId, projectKey, startDate, endDate });

        const result = await withCache(
            cacheKey,
            async () => {
                // Build JQL for completed issues in date range
                let jql = `status changed to Done during ("${startDate}", "${endDate}")`;

                if (projectKey && projectKey !== 'all') {
                    jql += ` AND project = "${projectKey}"`;
                }

                // Fetch issues with assignee and time tracking data
                const issuesData = await searchAllJira(jql, {
                    accessToken,
                    cloudId,
                    fields: ['assignee', 'timespent', 'timeoriginalestimate', 'created', 'resolutiondate', 'duedate', 'status'],
                    maxResults: 500,
                });

                return issuesData;
            },
            { ttlMs: CACHE_TTL.TEAM_COMPARISON }
        );

        const issues = result.issues || [];

        // Group by assignee
        const memberMap = new Map<string, {
            userId: string;
            userName: string;
            avatarUrl?: string;
            issues: any[];
            totalTimeSpent: number;
            completedOnTime: number;
            totalWithDueDate: number;
        }>();

        issues.forEach((issue: any) => {
            const assignee = issue.fields.assignee;
            if (!assignee) return;

            const userId = assignee.accountId;
            if (!memberMap.has(userId)) {
                memberMap.set(userId, {
                    userId,
                    userName: assignee.displayName,
                    avatarUrl: assignee.avatarUrls?.['48x48'],
                    issues: [],
                    totalTimeSpent: 0,
                    completedOnTime: 0,
                    totalWithDueDate: 0,
                });
            }

            const member = memberMap.get(userId)!;
            member.issues.push(issue);
            member.totalTimeSpent += issue.fields.timespent || 0;

            // Check punctuality
            if (issue.fields.duedate && issue.fields.resolutiondate) {
                member.totalWithDueDate++;
                const dueDate = new Date(issue.fields.duedate);
                const resolvedDate = new Date(issue.fields.resolutiondate);
                if (resolvedDate <= dueDate) {
                    member.completedOnTime++;
                }
            }
        });

        // Calculate metrics for each member
        const members: TeamMemberStats[] = [];

        memberMap.forEach((member) => {
            const issuesCompleted = member.issues.length;
            const hoursLogged = Math.round(member.totalTimeSpent / 3600 * 10) / 10;

            // Calculate average cycle time (created to resolved)
            let totalCycleTime = 0;
            let cycleTimeCount = 0;
            member.issues.forEach((issue: any) => {
                if (issue.fields.created && issue.fields.resolutiondate) {
                    const created = new Date(issue.fields.created).getTime();
                    const resolved = new Date(issue.fields.resolutiondate).getTime();
                    totalCycleTime += (resolved - created) / (1000 * 60 * 60); // hours
                    cycleTimeCount++;
                }
            });
            const avgCycleTimeHours = cycleTimeCount > 0 ? Math.round(totalCycleTime / cycleTimeCount * 10) / 10 : 0;

            // Punctuality percentage
            const punctuality = member.totalWithDueDate > 0
                ? Math.round((member.completedOnTime / member.totalWithDueDate) * 100)
                : 100; // Assume 100% if no due dates

            // Quality score (simplified - based on avg cycle time and punctuality)
            // Lower cycle time and higher punctuality = better quality
            // This is a simplified calculation; real implementation would use bug rates, reopens, etc.
            let qualityScore = 70; // Base score
            if (punctuality >= 90) qualityScore += 15;
            else if (punctuality >= 70) qualityScore += 10;
            else if (punctuality >= 50) qualityScore += 5;

            if (avgCycleTimeHours <= 24) qualityScore += 15;
            else if (avgCycleTimeHours <= 48) qualityScore += 10;
            else if (avgCycleTimeHours <= 72) qualityScore += 5;

            qualityScore = Math.min(100, Math.max(0, qualityScore));

            members.push({
                userId: member.userId,
                userName: member.userName,
                avatarUrl: member.avatarUrl,
                metrics: {
                    issuesCompleted,
                    hoursLogged,
                    avgCycleTimeHours,
                    punctuality,
                    qualityScore,
                },
            });
        });

        // Sort by issues completed (descending)
        members.sort((a, b) => b.metrics.issuesCompleted - a.metrics.issuesCompleted);

        // Calculate team averages
        const teamAverages = {
            issuesCompleted: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.metrics.issuesCompleted, 0) / members.length) : 0,
            hoursLogged: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.metrics.hoursLogged, 0) / members.length * 10) / 10 : 0,
            avgCycleTimeHours: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.metrics.avgCycleTimeHours, 0) / members.length * 10) / 10 : 0,
            punctuality: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.metrics.punctuality, 0) / members.length) : 0,
            qualityScore: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.metrics.qualityScore, 0) / members.length) : 0,
        };

        return NextResponse.json({
            members,
            teamAverages,
            totalMembers: members.length,
            totalIssues: issues.length,
            dateRange: { startDate, endDate },
        });

    } catch (error: any) {
        console.error('Team Comparison API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch team comparison data' },
            { status: 500 }
        );
    }
}
