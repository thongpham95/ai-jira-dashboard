"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
// import { BurndownChart } from "@/components/charts/BurndownChart"; // Hide burndown as requested for replacement or keep? User said "Column/Line chart". We will reuse Workload or custom.
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { MemberTaskTable } from "@/components/tables/MemberTaskTable";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkloadBarChart } from "@/components/charts/WorkloadBarChart";
import { AIExecutiveSummary } from "@/components/dashboard/AIExecutiveSummary";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [sprintName, setSprintName] = useState("--");
    const [totalHours, setTotalHours] = useState<string>("--");
    const [jiraHost, setJiraHost] = useState<string>("");

    useEffect(() => {
        fetch('/api/settings/jira-host').then(r => r.json()).then(d => setJiraHost(d.host || '')).catch(() => { });
    }, []);

    useEffect(() => {
        async function fetchProjectData() {
            setLoading(true);
            try {
                // 1. Find Project Key from ID
                const pRes = await fetch('/api/projects');
                const projects = await pRes.json();
                const matchedProject = Array.isArray(projects) ? projects.find((p: any) => p.id === id || p.key === id) : null;

                if (matchedProject) {
                    setProject(matchedProject);
                    const projectKey = matchedProject.key;

                    // 2. Fetch Issues (include sprint customfield)
                    const jql = `project = "${projectKey}" ORDER BY updated DESC`;
                    const iRes = await fetch('/api/issues', {
                        method: 'POST',
                        body: JSON.stringify({
                            jql,
                            maxResults: 100,
                            fields: ['summary', 'status', 'priority', 'issuetype', 'parent', 'updated', 'sprint']
                        })
                    });
                    const iData = await iRes.json();

                    if (iData.issues) {
                        setTasks(iData.issues);
                        // Extract active sprint name from issues
                        for (const issue of iData.issues) {
                            const sprint = issue.fields?.sprint;
                            if (sprint && sprint.state === 'active') {
                                setSprintName(sprint.name);
                                break;
                            }
                        }
                    }

                    // 3. Fetch worklogs for total hours
                    const endDate = new Date().toISOString().split('T')[0];
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 30);
                    const startDateStr = startDate.toISOString().split('T')[0];

                    const wRes = await fetch('/api/worklogs', {
                        method: 'POST',
                        body: JSON.stringify({
                            startDate: startDateStr,
                            endDate: endDate,
                            projectIds: [projectKey]
                        })
                    });
                    const wData = await wRes.json();
                    if (wData.worklogs) {
                        const totalSeconds = wData.worklogs.reduce(
                            (sum: number, log: any) => sum + (log.timeSpentSeconds || 0), 0
                        );
                        setTotalHours(Math.round(totalSeconds / 3600) + "h");
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchProjectData();
    }, [id]);

    // Calculate Stats
    const totalTasks = tasks.length;
    const totalBugs = tasks.filter((t: any) => t.fields.issuetype?.name?.toLowerCase().includes('bug')).length;
    // Status Distribution
    const statusDist: Record<string, number> = {};
    tasks.forEach((t: any) => {
        const s = t.fields.status?.name || 'Unknown';
        statusDist[s] = (statusDist[s] || 0) + 1;
    });
    const pieData = Object.keys(statusDist).map(k => ({ name: k, value: statusDist[k] }));

    // Filter Tasks
    const visibleTasks = filterStatus ? tasks.filter((t: any) => t.fields.status?.name === filterStatus) : tasks;

    if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-[300px]" /></div>;

    if (!project) return <div className="p-6">Không tìm thấy dự án.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.key}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Sprint hiện tại" value={sprintName} />
                <StatCard title="Tổng công việc" value={totalTasks} />
                <StatCard title="Lỗi (Bug)" value={totalBugs} className="text-red-500" />
                <StatCard title="Tổng giờ" value={totalHours} description="30 ngày gần nhất" />
            </div>

            {/* AI Executive Summary */}
            <AIExecutiveSummary
                projectKey={project.key}
                projectName={project.name}
            />

            <div className="grid gap-4 md:grid-cols-2">
                {/* Reusing WorkloadBarChart to show Hours by Member for this project */}
                <WorkloadBarChart projectId={project.key} title="Khối lượng công việc theo thành viên (Giờ)" />
                <StatusPieChart data={pieData} onSliceClick={(name) => setFilterStatus(name === filterStatus ? null : name)} title="Trạng thái công việc (Nhấn để lọc)" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Danh sách công việc {filterStatus && <span className="text-muted-foreground text-base font-normal">(Trạng thái: {filterStatus})</span>}
                    </h2>
                    {filterStatus && <Button variant="ghost" onClick={() => setFilterStatus(null)} size="sm">Xóa bộ lọc</Button>}
                </div>
                <MemberTaskTable tasks={visibleTasks} jiraHost={jiraHost} />
            </div>
        </div>
    );
}
