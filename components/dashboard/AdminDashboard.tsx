"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FolderKanban, CheckCircle2, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityStream } from "@/components/ActivityStream";
import { WorkloadBarChart } from "@/components/charts/WorkloadBarChart";
import { JQLSearch } from "@/components/search/JQLSearch";
import { AIExecutiveSummary } from "@/components/dashboard/AIExecutiveSummary";
import { useLanguage } from "@/components/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminDashboard() {
    const { t } = useLanguage();
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

                // 2. Fetch Issues Stats + Weekly Worklogs (Parallel)
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - 7);
                const weekStartStr = weekStart.toISOString().split('T')[0];
                const todayStr = new Date().toISOString().split('T')[0];

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
                        body: JSON.stringify({ startDate: weekStartStr, endDate: todayStr })
                    })
                ]);

                const openIssues = await openIssuesRes.json();
                const criticalBugs = await bugsRes.json();
                const worklogsData = await worklogsRes.json();

                // Calculate total weekly hours from worklogs
                const totalWeeklySeconds = (worklogsData.worklogs || []).reduce(
                    (sum: number, log: any) => sum + (log.timeSpentSeconds || 0), 0
                );
                const totalWeeklyHours = Math.round(totalWeeklySeconds / 3600);

                // 3. Update State
                setStats({
                    activeProjects: Array.isArray(projects) ? projects.length : 0,
                    openIssues: openIssues.total || 0,
                    criticalBugs: criticalBugs.total || 0,
                    totalHours: totalWeeklyHours
                });

            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError(t.dashboard.loadError);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [t.dashboard.loadError]);

    const router = useRouter();

    const handleSearch = (jql: string) => {
        router.push(`/search?query=${encodeURIComponent(jql)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
                <div className="flex items-center gap-4 w-[600px]">
                    <div className="w-[200px]">
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
                    <div className="flex-1">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <WorkloadBarChart projectId={selectedProjectId} />
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <ActivityStream projectId={selectedProjectId} />
                </div>
            </div>
        </div>
    );
}
