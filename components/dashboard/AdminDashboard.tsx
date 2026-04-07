"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, FolderKanban, CheckCircle2, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityStream } from "@/components/ActivityStream";
import { WorkloadBarChart } from "@/components/charts/WorkloadBarChart";
import { TeamComparisonChart } from "@/components/charts/TeamComparisonChart";
import { JQLSearch } from "@/components/search/JQLSearch";
import { AIExecutiveSummary } from "@/components/dashboard/AIExecutiveSummary";
import { EnhancedActiveTasks } from "@/components/dashboard/EnhancedActiveTasks";
import { TimeRangeSelector, TimeRange, getDefaultTimeRange } from "@/components/ui/time-range-selector";
import { ExportReports, prepareExportData, ExportData } from "@/components/reports/ExportReports";
import { useLanguage } from "@/components/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminDashboard() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState({
        activeProjects: 0,
        openIssues: 0,
        criticalBugs: 0,
        totalHours: 0
    });
    const [projectsList, setProjectsList] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Time Range state for filtering
    const [timeRange, setTimeRange] = useState<TimeRange>(() =>
        getDefaultTimeRange("week", language as "vi" | "en")
    );

    // Export data state
    const exportData = useMemo<ExportData>(() => {
        const vi = language === "vi";
        return prepareExportData(
            vi ? "Báo cáo Tổng quan Dashboard" : "Dashboard Overview Report",
            [
                { key: "metric", label: vi ? "Chỉ số" : "Metric" },
                { key: "value", label: vi ? "Giá trị" : "Value" },
                { key: "description", label: vi ? "Mô tả" : "Description" },
            ],
            [
                { metric: t.dashboard.activeProjects, value: stats.activeProjects, description: t.dashboard.projectsFromJira },
                { metric: t.dashboard.openIssues, value: stats.openIssues, description: t.dashboard.unresolvedIssues },
                { metric: t.dashboard.criticalBugs, value: stats.criticalBugs, description: t.dashboard.highPriorityBugs },
                { metric: t.dashboard.weeklyHours, value: stats.totalHours, description: t.dashboard.totalWeeklyHours },
            ],
            {
                [vi ? "Khoảng thời gian" : "Time Range"]: timeRange.label,
                [vi ? "Tổng dự án" : "Total Projects"]: stats.activeProjects,
                [vi ? "Issues chưa xử lý" : "Open Issues"]: stats.openIssues,
            }
        );
    }, [stats, t, language, timeRange.label]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // 1. Fetch Active Projects
                const projectsRes = await fetch('/api/projects');
                const projects = await projectsRes.json();

                if (Array.isArray(projects)) {
                    setProjectsList(projects);
                    // Default filter logic: Find [TVT] PAYDAES
                    const defaultProj = projects.find((p: any) => p.name.includes('PAYDAES') || p.key === 'TVT');
                    if (defaultProj) {
                        setSelectedProjectId(defaultProj.id);
                    }
                }

                // 2. Fetch Issues Stats + Worklogs based on time range
                const [openIssuesRes, bugsRes, worklogsRes] = await Promise.all([
                    fetch('/api/issues/count', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jql: 'statusCategory != Done AND resolution = Unresolved' })
                    }),
                    fetch('/api/issues/count', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jql: 'issuetype = Bug AND priority in (High, Highest) AND resolution = Unresolved' })
                    }),
                    fetch('/api/worklogs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ startDate: timeRange.startDate, endDate: timeRange.endDate })
                    })
                ]);

                const openIssues = await openIssuesRes.json();
                const criticalBugs = await bugsRes.json();
                const worklogsData = await worklogsRes.json();

                // Calculate total hours from worklogs based on time range
                const totalSeconds = (worklogsData.worklogs || []).reduce(
                    (sum: number, log: any) => sum + (log.timeSpentSeconds || 0), 0
                );
                const totalHours = Math.round(totalSeconds / 3600);

                // 3. Update State
                setStats({
                    activeProjects: Array.isArray(projects) ? projects.length : 0,
                    openIssues: openIssues.total || 0,
                    criticalBugs: criticalBugs.total || 0,
                    totalHours: totalHours
                });

            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError(t.dashboard.loadError);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [t.dashboard.loadError, timeRange.startDate, timeRange.endDate]);

    const router = useRouter();

    const handleSearch = (jql: string) => {
        router.push(`/search?query=${encodeURIComponent(jql)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Time Range Selector */}
                    <TimeRangeSelector
                        value={timeRange}
                        onChange={setTimeRange}
                        language={language as "vi" | "en"}
                    />

                    {/* Project Filter */}
                    <div className="w-[180px]">
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder={t.dashboard.selectProject} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.dashboard.allProjects}</SelectItem>
                                {projectsList.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export Reports */}
                    <ExportReports data={exportData} fileName="dashboard-report" />

                    {/* JQL Search */}
                    <div className="w-[250px]">
                        <JQLSearch onSearch={handleSearch} isLoading={loading} />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md text-sm border border-red-200 dark:border-red-900">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={t.dashboard.activeProjects}
                    value={loading ? "..." : stats.activeProjects}
                    icon={FolderKanban}
                    description={t.dashboard.projectsFromJira}
                />
                <StatCard
                    title={t.dashboard.openIssues}
                    value={loading ? "..." : stats.openIssues}
                    icon={CheckCircle2}
                    description={t.dashboard.unresolvedIssues}
                />
                <StatCard
                    title={t.dashboard.criticalBugs}
                    value={loading ? "..." : stats.criticalBugs}
                    icon={AlertCircle}
                    description={t.dashboard.highPriorityBugs}
                    className="border-red-200 dark:border-red-900"
                />
                <StatCard
                    title={t.dashboard.weeklyHours}
                    value={loading ? "..." : stats.totalHours}
                    icon={Users}
                    description={t.dashboard.totalWeeklyHours}
                />
            </div>

            {/* AI Executive Summary */}
            <AIExecutiveSummary
                projectKey={projectsList.find((p: any) => p.id === selectedProjectId)?.key || selectedProjectId}
                projectName={projectsList.find((p: any) => p.id === selectedProjectId)?.name}
            />

            {/* Real-time Task Visualization */}
            <div className="grid gap-4 md:grid-cols-1 mb-4">
                <EnhancedActiveTasks hideHeader={true} initialProjectKey={selectedProjectId} />
            </div>

            <div className="grid gap-4 md:grid-cols-1 mb-4">
                <div className="h-[400px]">
                    <ActivityStream projectId={selectedProjectId} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-7">
                    <WorkloadBarChart projectId={selectedProjectId} />
                </div>
            </div>

            {/* Team Comparison Chart */}
            <TeamComparisonChart
                projectKey={projectsList.find((p: any) => p.id === selectedProjectId)?.key || selectedProjectId}
                startDate={timeRange.startDate}
                endDate={timeRange.endDate}
            />
        </div>
    );
}
