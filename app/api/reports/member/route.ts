import { NextResponse } from 'next/server';
import { searchAllJira } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const projectKey = searchParams.get('projectKey');
        // Default 30 days
        const days = parseInt(searchParams.get('days') || '30');

        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        // 1. Dual-Query Strategy

        // Query A: Worklog Data (Source of Truth for Participated Tasks)
        // We fetch issues where the user logged work in the period.
        const worklogJql = `worklogAuthor = "${userId}" AND worklogDate >= "${startDateStr}"`;

        const worklogResults = await searchAllJira(worklogJql, {
            fields: ['worklog', 'summary', 'project', 'updated', 'status', 'resolutiondate', 'duedate', 'timespent', 'timeoriginalestimate', 'created', 'issuetype'],
            accessToken,
            cloudId
        });

        // In Worklog-Centric approach, "Member Issues" are simply tasks the member worked on.
        const worklogIssues = worklogResults.issues || [];
        const memberIssues = worklogIssues; // Use worklog issues for delivery metrics too

        // 2. Fetch Team Issues (Benchmark)
        let teamJql = `statusCategory = Done AND updated >= "${startDateStr}"`;
        if (projectKey) {
            teamJql += ` AND project = "${projectKey}"`;
        }
        const teamResults = await searchAllJira(teamJql, {
            maxResults: 200,
            fields: ['timespent', 'duedate', 'resolutiondate', 'issuetype', 'updated', 'created'],
            accessToken,
            cloudId
        });
        const teamIssues = teamResults.issues || [];


        // 3. Process Worklogs (Query A) -> Hours & Consistency
        const weeklyHoursMap: Record<string, number> = {};
        const now = new Date();
        const weekLabels: string[] = [];

        // Initialize weeks
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
            const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            weeklyHoursMap[label] = 0;
            weekLabels.push(label);
        }

        function getWeekLabel(dateStr: string): string | null {
            const date = new Date(dateStr);
            for (let i = 7; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                if (date >= weekStart && date < weekEnd) {
                    return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
            return null;
        }

        let totalAccurateHours = 0;
        const worklogStartDate = new Date(startDateStr);
        const detailedWorklogs: any[] = [];

        worklogIssues.forEach((issue: any) => {
            const worklogs = issue.fields.worklog?.worklogs || [];

            worklogs.forEach((log: any) => {
                // Filter by Author AND Date
                const isAuthor = log.author?.accountId === userId || log.author?.name === userId; // name fallback
                if (!isAuthor) return;

                const started = new Date(log.started);
                if (started >= worklogStartDate) {
                    const hours = log.timeSpentSeconds / 3600;
                    totalAccurateHours += hours;

                    const w = getWeekLabel(log.started);
                    if (w && w in weeklyHoursMap) {
                        weeklyHoursMap[w] += hours;
                    }

                    // Add to detailed list
                    detailedWorklogs.push({
                        id: log.id,
                        date: log.started,
                        issueKey: issue.key,
                        issueSummary: issue.fields.summary,
                        hours: parseFloat(hours.toFixed(2)),
                        comment: typeof log.comment === 'string' ? log.comment : (log.comment?.content?.[0]?.content?.[0]?.text || "")
                    });
                }
            });
        });

        // Sort worklogs by date desc
        detailedWorklogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 4. Process Delivery (Query B) -> Completion & Punctuality
        const weeklyCompletions: Record<string, number> = {};
        weekLabels.forEach(w => weeklyCompletions[w] = 0);

        function calculateDeliveryMetrics(issues: any[]) {
            let completedCount = 0;
            let totalBugTime = 0;
            let bugCount = 0;
            let onTimeCount = 0;
            let dueCount = 0;
            let totalIssueTimeSpent = 0; // fallback usage

            issues.forEach((issue: any) => {
                const f = issue.fields;
                // Only count as "Completed" if status is Done
                // Worklog query returns issues user worked on, regardless of status.
                const isDone = f.status?.statusCategory?.key === 'done' || f.status?.name?.toLowerCase() === 'done';
                if (!isDone) return;

                completedCount++;
                totalIssueTimeSpent += (f.timespent || 0);

                const pd = f.resolutiondate || f.updated;
                if (pd) {
                    const w = getWeekLabel(pd);
                    if (w && w in weeklyCompletions) {
                        weeklyCompletions[w]++;
                    }
                }

                // Bug Fix Time
                if (f.issuetype?.name?.toLowerCase() === 'bug') {
                    const created = new Date(f.created).getTime();
                    const resolved = new Date(f.resolutiondate || f.updated).getTime();
                    const duration = (resolved - created) / 1000;
                    if (duration > 0) {
                        totalBugTime += duration;
                        bugCount++;
                    }
                }

                // Punctuality
                if (f.duedate && pd) {
                    const due = new Date(f.duedate);
                    const resolved = new Date(pd);
                    due.setHours(23, 59, 59, 999);
                    dueCount++;
                    if (resolved <= due) {
                        onTimeCount++;
                    }
                }
            });

            return {
                completedCount,
                avgBugFixTime: bugCount > 0 ? totalBugTime / bugCount : 0,
                punctuality: dueCount > 0 ? (onTimeCount / dueCount) * 100 : 0,
                bugCount
            };
        }

        const deliveryMetrics = calculateDeliveryMetrics(memberIssues);
        // Team metrics (reuse calc is fine, but team doesn't need worklog precision for benchmark usually)
        // For team, we can stick to simpler issue-based logic or duplicate.
        // Let's perform simple avg on team issues for benchmark
        const teamMetricsRaw = calculateDeliveryMetrics(teamIssues);
        const teamAvgTime = teamIssues.length > 0 ? (teamIssues.reduce((acc: number, i: any) => acc + (i.fields.timespent || 0), 0) / teamIssues.length) / 3600 : 0; // simple avg issue time

        // 5. Final Metrics Combination
        // Avg Time / Task = Total Accurate Hours / Completed Count
        const avgTimePerTask = deliveryMetrics.completedCount > 0
            ? (totalAccurateHours * 3600) / deliveryMetrics.completedCount
            : 0;

        const weeklyCompletionsArr = weekLabels.map(w => ({ week: w, count: weeklyCompletions[w] }));
        const weeklyHoursArr = weekLabels.map(w => ({ week: w, hours: parseFloat(weeklyHoursMap[w].toFixed(1)) }));

        // Refined Consistency: Standard Deviation of Weekly Counts
        // calc mean
        const counts = Object.values(weeklyCompletions);
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        // calc variance
        const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        // CV (Coefficient of Variation) = stdDev / mean. Lower is better.
        // Score = 100 - (CV * 100). If mean is 0, score is 0.
        // We cap CV impact. e.g. CV of 0.5 (high variance) => 50 score.
        let consistencyScore = 0;
        if (mean > 0) {
            const cv = stdDev / mean;
            consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (cv * 50))));
            // Multiplier 50 means if stdDev is 2x mean, score is 0.
        }

        // Calculate Radar Scores (0-100)
        // We compare User against fixed baselines OR Team Averages
        const baselineTimePerTask = 8 * 3600; // 8 hours ideal
        const baselineBugTime = 4 * 3600; // 4 hours ideal
        const baselineVolume = 5 * (days / 7); // 5 tasks per week

        function getRadarScores(m: any, consistency: number | null = null) {
            return {
                punctuality: Math.round(m.punctuality),
                // Speed: Lower time is better. 
                // Formula: 100 * (Baseline / Actual). Cap at 100.
                speed: m.avgTimePerTask > 0 ? Math.min(100, Math.round((baselineTimePerTask / m.avgTimePerTask) * 80)) : 0,
                // Volume: Higher is better.
                volume: Math.min(100, Math.round((m.completedCount / baselineVolume) * 50)),
                // Bug Fix: Lower time is better.
                bugFixRate: m.avgBugFixTime > 0 ? Math.min(100, Math.round((baselineBugTime / m.avgBugFixTime) * 80)) : 50,
                consistency: consistency !== null ? consistency : 50 // Default 50 for team?
            };
        }

        // 6. Construct User & Team Metrics Objects for Radar/Response
        const userMetrics = {
            completedCount: deliveryMetrics.completedCount,
            avgTimePerTask: avgTimePerTask, // seconds
            avgBugFixTime: deliveryMetrics.avgBugFixTime,
            punctuality: deliveryMetrics.punctuality,
            totalTimeSpent: totalAccurateHours * 3600,
            bugCount: deliveryMetrics.bugCount
        };

        const teamMetrics = {
            completedCount: teamMetricsRaw.completedCount,
            avgTimePerTask: teamAvgTime * 3600, // seconds
            avgBugFixTime: teamMetricsRaw.avgBugFixTime,
            punctuality: teamMetricsRaw.punctuality,
            // Volume baseline? usage...
        };

        const userRadar = getRadarScores(userMetrics, consistencyScore);
        const teamRadar = getRadarScores(teamMetrics, 70); // Assume team consistency is generally stable/high (70)

        // Fix: Radar Chart expects array of objects with subjects
        const radarChartData = [
            { subject: 'Đúng hạn', A: userRadar.punctuality, B: teamRadar.punctuality, fullMark: 100 },
            { subject: 'Tốc độ', A: userRadar.speed, B: teamRadar.speed, fullMark: 100 },
            { subject: 'Khối lượng', A: userRadar.volume, B: teamRadar.volume, fullMark: 100 },
            { subject: 'Fix Bug', A: userRadar.bugFixRate, B: teamRadar.bugFixRate, fullMark: 100 },
            { subject: 'Ổn định', A: userRadar.consistency, B: teamRadar.consistency, fullMark: 100 },
        ];


        return NextResponse.json({
            userId,
            period: `${days} days`,
            issuesAnalyzed: memberIssues.length,
            metrics: {
                avgTimePerTaskSeconds: userMetrics.avgTimePerTask,
                avgBugFixTimeSeconds: userMetrics.avgBugFixTime,
                punctualityPercentage: userMetrics.punctuality,
                totalCompleted: userMetrics.completedCount,
                totalBugsFixed: userMetrics.bugCount,
                totalHoursLogged: totalAccurateHours
            },
            weeklyCompletions: weeklyCompletionsArr,
            weeklyHours: weeklyHoursArr,
            radarData: radarChartData,
            detailedWorklogs
        });

    } catch (error: any) {
        console.error("Error generating member report:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
    }
}
