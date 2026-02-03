"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { MemberTaskTable } from "@/components/tables/MemberTaskTable";
import { CompletionBarChart } from "@/components/charts/CompletionBarChart";
import { HoursTimelineChart } from "@/components/charts/HoursTimelineChart";
import { EfficiencyRadarChart } from "@/components/charts/EfficiencyRadarChart";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorklogHistoryTable } from "@/components/tables/WorklogHistoryTable";
import { Info } from "lucide-react";

export default function MemberReportPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId: rawUserId } = use(params);
    const userId = decodeURIComponent(rawUserId);
    const searchParams = useSearchParams();
    const userName = searchParams.get('name') || userId;
    const projectFilter = searchParams.get('project');

    const [stats, setStats] = useState({
        avgTimePerTask: "0h",
        bugFixTime: "0h",
        punctuality: "0%",
        completed: 0,
        totalHoursLogged: "0h"
    });
    const [tasks, setTasks] = useState<any[]>([]);
    const [worklogHistory, setWorklogHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [jiraHost, setJiraHost] = useState<string>("");
    const [weeklyCompletions, setWeeklyCompletions] = useState<{ week: string; count: number }[]>([]);
    const [weeklyHours, setWeeklyHours] = useState<{ week: string; hours: number }[]>([]);
    const [radarData, setRadarData] = useState<{ subject: string; A: number; fullMark: number }[]>([]);

    useEffect(() => {
        fetch('/api/settings/jira-host').then(r => r.json()).then(d => setJiraHost(d.host || '')).catch(() => { });
    }, []);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // 1. Build JQL for all tasks assigned to this user
                // 1. Build JQL for Participated Tasks (Worklog-Centric)
                // We want tasks where the user has logged work in the last 30 days
                let jql = `worklogAuthor = "${userId}" AND worklogDate >= -30d`;
                if (projectFilter) {
                    jql += ` AND project = "${projectFilter}"`;
                }
                jql += ` ORDER BY updated DESC`;

                // 2. Fetch KPI stats + task list in parallel
                // Using days=30 for consistent metrics
                const reportUrl = `/api/reports/member?userId=${userId}${projectFilter ? `&projectKey=${projectFilter}` : ''}&days=30`;

                const [reportRes, issuesRes] = await Promise.all([
                    fetch(reportUrl),
                    fetch('/api/issues', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jql,
                            fetchAll: true,
                            fields: ['summary', 'status', 'priority', 'issuetype', 'parent', 'updated', 'timespent', 'timeoriginalestimate']
                        })
                    })
                ]);

                const reportData = await reportRes.json();
                const issuesData = await issuesRes.json();

                // 3. Process tasks (Delivery Data)
                const allTasks = issuesData.issues || [];
                setTasks(allTasks);

                // 4. Set Worklog History (Worklog Data)
                if (reportData.detailedWorklogs) {
                    setWorklogHistory(reportData.detailedWorklogs);
                }

                // 5. Set stats using ACCURATE metrics from backend
                if (reportData.metrics) {
                    setStats({
                        avgTimePerTask: (reportData.metrics.avgTimePerTaskSeconds / 3600).toFixed(1) + "h",
                        bugFixTime: (reportData.metrics.avgBugFixTimeSeconds / 3600).toFixed(1) + "h",
                        punctuality: Math.round(reportData.metrics.punctualityPercentage) + "%",
                        completed: reportData.metrics.totalCompleted,
                        totalHoursLogged: (reportData.metrics.totalHoursLogged || 0).toFixed(1) + "h"
                    });
                }

                // 6. Set chart data
                if (reportData.weeklyCompletions) setWeeklyCompletions(reportData.weeklyCompletions);
                if (reportData.weeklyHours) setWeeklyHours(reportData.weeklyHours);
                if (reportData.radarData) setRadarData(reportData.radarData);

            } catch (error) {
                console.error("Failed to load member data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [userId, projectFilter]);

    if (loading) {
        return <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid gap-4 md:grid-cols-5">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/resources"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Báo cáo: {userName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {projectFilter && <span className="text-sm text-muted-foreground">Dự án: {projectFilter}</span>}
                        <span className="text-sm text-muted-foreground">Tổng số task: {tasks.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="group relative">
                    <StatCard
                        title="Tổng giờ logged"
                        value={stats.totalHoursLogged}
                        icon={Clock}
                        description="Trong 30 ngày"
                        infoText="Tổng thời gian thực tế đã log (Sum of Worklogs)."
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 px-1 h-0 opacity-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
                        Formula: <code>Sum(Worklog.timeSpent)</code>
                    </div>
                </div>

                <div className="group relative">
                    <StatCard
                        title="Thời gian / Task"
                        value={stats.avgTimePerTask}
                        description="Trung bình"
                        infoText="Tỷ lệ: Tổng giờ làm / Số task hoàn thành."
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 px-1 h-0 opacity-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
                        Formula: <code>TotalHours / CompletedTasks</code>
                    </div>
                </div>

                <div className="group relative">
                    <StatCard
                        title="Thời gian fix Bug"
                        value={stats.bugFixTime}
                        description="Avg Cycle Time"
                        infoText="Thời gian từ lúc tạo bug đến khi xử lý xong."
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 px-1 h-0 opacity-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
                        Formula: <code>Avg(Resolved - Created)</code>
                    </div>
                </div>

                <div className="group relative">
                    <StatCard
                        title="Đúng hạn"
                        value={stats.punctuality}
                        description="Tỷ lệ %"
                        infoText="Task hoàn thành đúng hạn / Tổng task có Due date."
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 px-1 h-0 opacity-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
                        Formula: <code>(OnTime / TotalDue) * 100</code>
                    </div>
                </div>

                <div className="group relative">
                    <StatCard
                        title="Công việc xong"
                        value={stats.completed}
                        description="Participated & Done"
                        infoText="Tổng số issue bạn đã log work (tham gia) và đã hoàn thành."
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 px-1 h-0 opacity-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 overflow-hidden">
                        Query: <code>worklogAuthor=user AND status=Done</code>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CompletionBarChart data={weeklyCompletions} title="Số task hoàn thành theo tuần" />
                <HoursTimelineChart data={weeklyHours} title="Số giờ logged theo tuần" />
                <EfficiencyRadarChart data={radarData} title="Biểu đồ năng lực" />
            </div>

            <div className="space-y-4">
                <Tabs defaultValue="tasks" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="tasks">Danh sách công việc ({tasks.length})</TabsTrigger>
                            <TabsTrigger value="worklogs">Lịch sử Log Work ({worklogHistory.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="tasks" className="space-y-4">
                        <div className="bg-muted/10 p-4 rounded-md border text-sm text-muted-foreground mb-4">
                            <h4 className="font-semibold flex items-center gap-2 mb-1 text-foreground">
                                <Info className="h-4 w-4" />
                                Danh sách Task đã tham gia (Participated)
                            </h4>
                            <p>Danh sách này hiển thị <strong>các Task mà {userName} đã log work</strong> trong 30 ngày qua (kể cả task của người khác). Các chỉ số hiệu suất được tính dựa trên danh sách quy mô này.</p>
                        </div>
                        <MemberTaskTable tasks={tasks} showTimeSpent jiraHost={jiraHost} />
                    </TabsContent>

                    <TabsContent value="worklogs" className="space-y-4">
                        <div className="bg-muted/10 p-4 rounded-md border text-sm text-muted-foreground mb-4">
                            <h4 className="font-semibold flex items-center gap-2 mb-1 text-foreground">
                                <Info className="h-4 w-4" />
                                Cách tính bảng này
                            </h4>
                            <p>Bảng này liệt kê <strong>từng dòng log work cụ thể của {userName}</strong> trong 30 ngày qua. Tổng giờ ở đây chính xác là con số dùng để tính KPI.</p>
                        </div>
                        <WorklogHistoryTable worklogs={worklogHistory} jiraHost={jiraHost} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
