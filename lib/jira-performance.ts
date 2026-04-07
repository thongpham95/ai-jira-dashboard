// Performance Metrics Engine
// Parses Jira issue changelogs to calculate role-specific cycle times
// and quality metrics for Developers, Tech Leads, and QC.

import { searchAllJiraWithChangelog, type JiraAuthOptions } from '@/lib/jira';

// ==========================================
// Types
// ==========================================

export interface StatusTransition {
    issueKey: string;
    issueSummary: string;
    issueType: string;
    fromStatus: string;
    toStatus: string;
    author: string; // accountId of who made the transition
    authorName: string;
    timestamp: string; // ISO date
}

export interface CycleTimeEntry {
    issueKey: string;
    issueSummary: string;
    issueType: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    assignee: string;
    assigneeName: string;
}

export interface MemberPerformanceMetrics {
    userId: string;
    userName: string;
    avatarUrl?: string;
    role: 'developer' | 'tech_lead' | 'qc' | 'mixed';

    // Cycle Times
    cycleTimes: CycleTimeEntry[];
    avgCycleTimeHours: number;
    medianCycleTimeHours: number;
    minCycleTimeHours: number;
    maxCycleTimeHours: number;

    // Throughput
    totalIssuesCompleted: number;
    totalStoryPoints: number;

    // Quality
    firstTimePassRate: number;   // % tasks not reopened
    reopenCount: number;
    totalReviewedOrTested: number;

    // Anomalies
    anomalies: PerformanceAnomaly[];
}

export interface PerformanceAnomaly {
    type: 'slow_cycle' | 'high_reopen' | 'no_activity' | 'overloaded';
    severity: 'warning' | 'critical';
    message: string;
    issueKey?: string;
    value?: number;
    threshold?: number;
}

export interface PerformanceResult {
    developers: MemberPerformanceMetrics[];
    techLeads: MemberPerformanceMetrics[];
    qcMembers: MemberPerformanceMetrics[];
    teamAverages: {
        developer: { avgCycleTimeHours: number; firstTimePassRate: number };
        techLead: { avgCycleTimeHours: number; reopenCount: number };
        qc: { avgCycleTimeHours: number; reopenCount: number };
    };
    dateRange: { start: string; end: string };
    totalIssuesAnalyzed: number;
}

// ==========================================
// Status mapping constants
// ==========================================

// Developer workflow: TODO -> IN PROGRESS -> CODE REVIEW
const DEV_START_STATUSES = ['To Do', 'TODO', 'OPEN', 'Open', 'Backlog', 'BACKLOG'];
const DEV_MID_STATUSES = ['In Progress', 'IN PROGRESS', 'In Development'];
const DEV_END_STATUSES = ['Code Review', 'CODE REVIEW', 'In Review', 'IN REVIEW'];

// Tech Lead workflow: CODE REVIEW -> DONE CODE REVIEW -> MERGED TO QC
const TL_START_STATUSES = ['Code Review', 'CODE REVIEW', 'In Review', 'IN REVIEW'];
const TL_MID_STATUSES = ['Done Code Review', 'DONE CODE REVIEW', 'Review Done', 'Reviewed'];
const TL_END_STATUSES = ['Merged To QC', 'MERGED TO QC', 'Ready for QC', 'Ready For Testing', 'QC'];

// QC workflow: TASK DONE / BUG FIXED -> TVT INTERNAL REVIEW -> REOPEN or CLOSED
const QC_START_STATUSES = ['Task Done', 'TASK DONE', 'Bug Fixed', 'BUG FIXED', 'Ready for QC', 'QC', 'Merged To QC', 'MERGED TO QC'];
const QC_MID_STATUSES = ['TVT Internal Review', 'TVT INTERNAL REVIEW', 'Internal Review', 'QC Review', 'Testing'];
const QC_END_STATUSES = ['Closed', 'CLOSED', 'Done', 'DONE', 'Reopen', 'REOPEN', 'Reopened', 'REOPENED'];

const REOPEN_STATUSES = ['Reopen', 'REOPEN', 'Reopened', 'REOPENED'];

function normalizeStatus(status: string): string {
    return status.trim().toLowerCase();
}

function statusIn(status: string, list: string[]): boolean {
    const normalized = normalizeStatus(status);
    return list.some(s => normalizeStatus(s) === normalized);
}

// ==========================================
// Data Fetching
// ==========================================

export async function fetchPerformanceData(
    options: JiraAuthOptions & {
        projectKey?: string;
        startDate: string;  // YYYY-MM-DD
        endDate: string;    // YYYY-MM-DD
        userIds?: string[];
    }
): Promise<PerformanceResult> {
    const { accessToken, cloudId, projectKey, startDate, endDate } = options;
    const authOpts = { accessToken, cloudId };

    // Build JQL to find issues with status changes in the date range
    let jql = `status CHANGED DURING ("${startDate}", "${endDate}")`;
    if (projectKey && projectKey !== 'all') {
        jql += ` AND project = "${projectKey}"`;
    }
    jql += ` ORDER BY updated DESC`;

    const data = await searchAllJiraWithChangelog(jql, {
        ...authOpts,
        fields: ['summary', 'status', 'issuetype', 'assignee', 'priority', 'customfield_10028'],
        expand: ['changelog'],
        maxResults: 100,
    });

    const issues = data.issues || [];

    // Parse all status transitions from changelogs
    const allTransitions: StatusTransition[] = [];

    for (const issue of issues) {
        const changelog = issue.changelog;
        if (!changelog?.histories) continue;

        for (const history of changelog.histories) {
            const historyDate = history.created || '';
            const authorId = history.author?.accountId || '';
            const authorName = history.author?.displayName || '';

            for (const item of (history.items || [])) {
                if (item.field === 'status') {
                    allTransitions.push({
                        issueKey: issue.key,
                        issueSummary: issue.fields?.summary || '',
                        issueType: issue.fields?.issuetype?.name || 'Task',
                        fromStatus: item.fromString || '',
                        toStatus: item.toString || '',
                        author: authorId,
                        authorName: authorName,
                        timestamp: historyDate,
                    });
                }
            }
        }
    }

    console.log(`[PERF] Parsed ${allTransitions.length} status transitions from ${issues.filter((i: any) => i.changelog?.histories?.length > 0).length}/${issues.length} issues`);

    // Filter transitions within date range
    const filteredTransitions = allTransitions.filter(t => {
        const d = t.timestamp.split('T')[0];
        return d >= startDate && d <= endDate;
    });

    // Calculate metrics per role
    const developers = calculateDeveloperMetrics(filteredTransitions, allTransitions, issues);
    const techLeads = calculateTechLeadMetrics(filteredTransitions, allTransitions, issues);
    const qcMembers = calculateQCMetrics(filteredTransitions, allTransitions, issues);

    // Filter by userIds if specified
    const filterByUser = (members: MemberPerformanceMetrics[]) => {
        if (!options.userIds || options.userIds.length === 0) return members;
        return members.filter(m => options.userIds!.includes(m.userId));
    };

    // Calculate Team Averages
    const calcAvg = (members: MemberPerformanceMetrics[], field: keyof MemberPerformanceMetrics) => {
        const validMembers = members.filter(m => m[field] !== undefined && typeof m[field] === 'number');
        if (validMembers.length === 0) return 0;
        const sum = validMembers.reduce((acc, m) => acc + (m[field] as number), 0);
        return Math.round((sum / validMembers.length) * 10) / 10;
    };

    const teamAverages = {
        developer: {
            avgCycleTimeHours: calcAvg(developers, 'avgCycleTimeHours'),
            firstTimePassRate: calcAvg(developers, 'firstTimePassRate'),
        },
        techLead: {
            avgCycleTimeHours: calcAvg(techLeads, 'avgCycleTimeHours'),
            reopenCount: calcAvg(techLeads, 'reopenCount'),
        },
        qc: {
            avgCycleTimeHours: calcAvg(qcMembers, 'avgCycleTimeHours'),
            reopenCount: calcAvg(qcMembers, 'reopenCount'),
        }
    };

    return {
        developers: filterByUser(developers),
        techLeads: filterByUser(techLeads),
        qcMembers: filterByUser(qcMembers),
        teamAverages,
        dateRange: { start: startDate, end: endDate },
        totalIssuesAnalyzed: issues.length,
    };
}

// ==========================================
// Developer Metrics
// ==========================================

function calculateDeveloperMetrics(
    transitions: StatusTransition[],
    _allTransitions: StatusTransition[],
    issues: any[]
): MemberPerformanceMetrics[] {
    const memberMap = new Map<string, {
        cycleTimes: CycleTimeEntry[];
        reopenCount: number;
        totalDone: number;
        storyPoints: number;
        name: string;
        avatar?: string;
    }>();

    // Group transitions by issue to find cycle time pairs
    const issueGroups = groupTransitionsByIssue(transitions);

    for (const [issueKey, issueTransitions] of issueGroups) {
        // Find transitions: something -> IN PROGRESS (start) and something -> CODE REVIEW (end)
        const startTransition = issueTransitions.find(t => statusIn(t.toStatus, DEV_MID_STATUSES));
        const endTransition = issueTransitions.find(t => statusIn(t.toStatus, DEV_END_STATUSES));

        if (startTransition && endTransition) {
            const start = new Date(startTransition.timestamp);
            const end = new Date(endTransition.timestamp);
            const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

            // Credit the person who moved to IN PROGRESS
            const userId = startTransition.author;
            const userName = startTransition.authorName;

            if (!memberMap.has(userId)) {
                memberMap.set(userId, { cycleTimes: [], reopenCount: 0, totalDone: 0, storyPoints: 0, name: userName });
            }

            const member = memberMap.get(userId)!;
            member.cycleTimes.push({
                issueKey,
                issueSummary: startTransition.issueSummary,
                issueType: startTransition.issueType,
                startTime: startTransition.timestamp,
                endTime: endTransition.timestamp,
                durationHours: Math.round(durationHours * 10) / 10,
                assignee: userId,
                assigneeName: userName,
            });
            member.totalDone++;

            // Get story points from issue
            const issue = issues.find(i => i.key === issueKey);
            const sp = issue?.fields?.story_points || issue?.fields?.customfield_10028 || 0;
            member.storyPoints += sp;
        }

        // Check for reopens (any transition TO a reopen status)
        const reopens = issueTransitions.filter(t => statusIn(t.toStatus, REOPEN_STATUSES));
        if (reopens.length > 0) {
            // Credit reopen to the developer who originally worked on it
            const startT = issueTransitions.find(t => statusIn(t.toStatus, DEV_MID_STATUSES));
            if (startT && memberMap.has(startT.author)) {
                memberMap.get(startT.author)!.reopenCount += reopens.length;
            }
        }
    }

    return Array.from(memberMap.entries()).map(([userId, data]) =>
        buildMemberMetrics(userId, data.name, 'developer', data.cycleTimes, data.reopenCount, data.totalDone, data.storyPoints)
    );
}

// ==========================================
// Tech Lead Metrics
// ==========================================

function calculateTechLeadMetrics(
    transitions: StatusTransition[],
    _allTransitions: StatusTransition[],
    issues: any[]
): MemberPerformanceMetrics[] {
    const memberMap = new Map<string, {
        cycleTimes: CycleTimeEntry[];
        reopenCount: number;
        totalDone: number;
        storyPoints: number;
        name: string;
    }>();

    const issueGroups = groupTransitionsByIssue(transitions);

    for (const [issueKey, issueTransitions] of issueGroups) {
        // TL cycle: transition to CODE REVIEW (start) -> transition to MERGED TO QC (end)
        const startTransition = issueTransitions.find(t => statusIn(t.toStatus, TL_START_STATUSES));
        const endTransition = issueTransitions.find(t => statusIn(t.toStatus, TL_END_STATUSES));

        if (startTransition && endTransition) {
            const start = new Date(startTransition.timestamp);
            const end = new Date(endTransition.timestamp);
            const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

            // Credit the person who moved to DONE CODE REVIEW or MERGED TO QC (the reviewer)
            const reviewer = endTransition.author;
            const reviewerName = endTransition.authorName;

            if (!memberMap.has(reviewer)) {
                memberMap.set(reviewer, { cycleTimes: [], reopenCount: 0, totalDone: 0, storyPoints: 0, name: reviewerName });
            }

            const member = memberMap.get(reviewer)!;
            member.cycleTimes.push({
                issueKey,
                issueSummary: startTransition.issueSummary,
                issueType: startTransition.issueType,
                startTime: startTransition.timestamp,
                endTime: endTransition.timestamp,
                durationHours: Math.round(durationHours * 10) / 10,
                assignee: reviewer,
                assigneeName: reviewerName,
            });
            member.totalDone++;

            const issue = issues.find(i => i.key === issueKey);
            const sp = issue?.fields?.story_points || issue?.fields?.customfield_10028 || 0;
            member.storyPoints += sp;
        }

        // Reopens after TL review = review ineffectiveness
        const reopens = issueTransitions.filter(t => statusIn(t.toStatus, REOPEN_STATUSES));
        if (reopens.length > 0 && endTransition) {
            const reviewer = endTransition.author;
            if (memberMap.has(reviewer)) {
                memberMap.get(reviewer)!.reopenCount += reopens.length;
            }
        }
    }

    return Array.from(memberMap.entries()).map(([userId, data]) =>
        buildMemberMetrics(userId, data.name, 'tech_lead', data.cycleTimes, data.reopenCount, data.totalDone, data.storyPoints)
    );
}

// ==========================================
// QC Metrics
// ==========================================

function calculateQCMetrics(
    transitions: StatusTransition[],
    _allTransitions: StatusTransition[],
    issues: any[]
): MemberPerformanceMetrics[] {
    const memberMap = new Map<string, {
        cycleTimes: CycleTimeEntry[];
        reopenCount: number;
        totalDone: number;
        storyPoints: number;
        name: string;
    }>();

    const issueGroups = groupTransitionsByIssue(transitions);

    for (const [issueKey, issueTransitions] of issueGroups) {
        // QC cycle: transition to QC_START (start) -> transition to CLOSED/REOPEN (end)
        const startTransition = issueTransitions.find(t => statusIn(t.toStatus, QC_START_STATUSES));
        const endTransition = issueTransitions.find(t => statusIn(t.toStatus, QC_END_STATUSES));

        if (startTransition && endTransition) {
            const start = new Date(startTransition.timestamp);
            const end = new Date(endTransition.timestamp);
            const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

            // Credit the QC person who made the end transition (CLOSED or REOPEN)
            const qcPerson = endTransition.author;
            const qcName = endTransition.authorName;

            if (!memberMap.has(qcPerson)) {
                memberMap.set(qcPerson, { cycleTimes: [], reopenCount: 0, totalDone: 0, storyPoints: 0, name: qcName });
            }

            const member = memberMap.get(qcPerson)!;
            member.cycleTimes.push({
                issueKey,
                issueSummary: startTransition.issueSummary,
                issueType: startTransition.issueType,
                startTime: startTransition.timestamp,
                endTime: endTransition.timestamp,
                durationHours: Math.round(durationHours * 10) / 10,
                assignee: qcPerson,
                assigneeName: qcName,
            });
            member.totalDone++;

            // QC reopen count (for Bug Validity)
            if (statusIn(endTransition.toStatus, REOPEN_STATUSES)) {
                member.reopenCount++;
            }

            const issue = issues.find(i => i.key === issueKey);
            const sp = issue?.fields?.story_points || issue?.fields?.customfield_10028 || 0;
            member.storyPoints += sp;
        }
    }

    return Array.from(memberMap.entries()).map(([userId, data]) =>
        buildMemberMetrics(userId, data.name, 'qc', data.cycleTimes, data.reopenCount, data.totalDone, data.storyPoints)
    );
}

// ==========================================
// Helpers
// ==========================================

function groupTransitionsByIssue(transitions: StatusTransition[]): Map<string, StatusTransition[]> {
    const map = new Map<string, StatusTransition[]>();
    for (const t of transitions) {
        if (!map.has(t.issueKey)) {
            map.set(t.issueKey, []);
        }
        map.get(t.issueKey)!.push(t);
    }
    // Sort each group by timestamp
    for (const [, group] of map) {
        group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return map;
}

function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildMemberMetrics(
    userId: string,
    userName: string,
    role: 'developer' | 'tech_lead' | 'qc',
    cycleTimes: CycleTimeEntry[],
    reopenCount: number,
    totalDone: number,
    storyPoints: number
): MemberPerformanceMetrics {
    const durations = cycleTimes.map(c => c.durationHours);
    const avgCycleTime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const medianCycleTime = median(durations);
    const minCycleTime = durations.length > 0 ? Math.min(...durations) : 0;
    const maxCycleTime = durations.length > 0 ? Math.max(...durations) : 0;

    const firstTimePassRate = totalDone > 0
        ? Math.round(((totalDone - reopenCount) / totalDone) * 100)
        : 0;

    // Detect anomalies
    const anomalies: PerformanceAnomaly[] = [];

    // Anomaly: Extremely slow cycle times (> 2x median of the person's own data, or > 48h as hard limit)
    const SLOW_THRESHOLD_HOURS = role === 'tech_lead' ? 24 : role === 'qc' ? 24 : 48;
    for (const ct of cycleTimes) {
        if (ct.durationHours > SLOW_THRESHOLD_HOURS) {
            anomalies.push({
                type: 'slow_cycle',
                severity: ct.durationHours > SLOW_THRESHOLD_HOURS * 2 ? 'critical' : 'warning',
                message: `${ct.issueKey}: ${Math.round(ct.durationHours)}h (ngưỡng: ${SLOW_THRESHOLD_HOURS}h)`,
                issueKey: ct.issueKey,
                value: ct.durationHours,
                threshold: SLOW_THRESHOLD_HOURS,
            });
        }
    }

    // Anomaly: High reopen rate
    if (totalDone > 2 && firstTimePassRate < 70) {
        anomalies.push({
            type: 'high_reopen',
            severity: firstTimePassRate < 50 ? 'critical' : 'warning',
            message: `Tỉ lệ pass lần đầu thấp: ${firstTimePassRate}% (${reopenCount}/${totalDone} bị reopen)`,
            value: firstTimePassRate,
            threshold: 70,
        });
    }

    // Anomaly: No activity
    if (totalDone === 0) {
        anomalies.push({
            type: 'no_activity',
            severity: 'warning',
            message: `Không có hoạt động nào trong khoảng thời gian được chọn`,
        });
    }

    return {
        userId,
        userName,
        role,
        cycleTimes,
        avgCycleTimeHours: Math.round(avgCycleTime * 10) / 10,
        medianCycleTimeHours: Math.round(medianCycleTime * 10) / 10,
        minCycleTimeHours: Math.round(minCycleTime * 10) / 10,
        maxCycleTimeHours: Math.round(maxCycleTime * 10) / 10,
        totalIssuesCompleted: totalDone,
        totalStoryPoints: storyPoints,
        firstTimePassRate,
        reopenCount,
        totalReviewedOrTested: totalDone,
        anomalies,
    };
}
