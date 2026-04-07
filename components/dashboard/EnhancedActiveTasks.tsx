"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Activity, AlertTriangle, Clock, Users, RefreshCw, Sparkles,
    ChevronDown, ChevronUp, ExternalLink, Flame, Timer, ArrowRight
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface ActiveTask {
    issueKey: string;
    summary: string;
    project: { key: string; name: string; avatarUrl?: string };
    issueType: { name: string; iconUrl?: string };
    status: { name: string; category: string; colorName: string };
    priority: { name: string; iconUrl?: string };
    assignee: { accountId: string; displayName: string; avatarUrl?: string };
    updatedAt: string;
    dueDate?: string;
    timeInStatus?: number;
}

interface ActiveTasksInsights {
    totalTasks: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byProject: Record<string, number>;
    byAssignee: Record<string, { count: number; displayName: string; avatarUrl?: string }>;
    overdueTasks: number;
    highPriorityTasks: number;
    avgTimeInStatus: number;
}

interface Project {
    key: string;
    name: string;
}

interface User {
    accountId: string;
    displayName: string;
    avatarUrl?: string;
}

const STATUS_COLORS: Record<string, string> = {
    "blue": "#3b82f6",
    "yellow": "#f59e0b",
    "green": "#10b981",
    "default": "#6366f1",
};

const PRIORITY_COLORS: Record<string, string> = {
    "Highest": "#ef4444",
    "High": "#f97316",
    "Medium": "#f59e0b",
    "Low": "#22c55e",
    "Lowest": "#6b7280",
};

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e879f9", "#f472b6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export interface EnhancedActiveTasksProps {
    hideHeader?: boolean;
    initialProjectKey?: string;
}

export function EnhancedActiveTasks({ hideHeader = false, initialProjectKey = "all" }: EnhancedActiveTasksProps = {}) {
    const { t, language } = useLanguage();
    const vi = language === "vi";

    // Data state
    const [tasks, setTasks] = useState<ActiveTask[]>([]);
    const [insights, setInsights] = useState<ActiveTasksInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Filter state
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>(initialProjectKey);
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [autoRefresh, setAutoRefresh] = useState(true);

    // AI state
    const [aiReview, setAiReview] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExpanded, setAiExpanded] = useState(true);

    // Fetch projects and users for filters
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [projectsRes, usersRes] = await Promise.all([
                    fetch("/api/projects"),
                    fetch("/api/users")
                ]);
                if (projectsRes.ok) {
                    const data = await projectsRes.json();
                    setProjects(data.projects || []);
                }
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users || []);
                }
            } catch (err) {
                console.error("Failed to fetch filters:", err);
            }
        };
        fetchFilters();
    }, []);

    // Fetch active tasks
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/api/reports/active-tasks?includeInsights=true`;
            if (selectedProject !== "all") {
                url += `&projectKey=${selectedProject}`;
            }
            if (selectedUser !== "all") {
                url += `&userId=${selectedUser}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch active tasks");

            setTasks(data.tasks || []);
            setInsights(data.insights || null);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedProject, selectedUser]);

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchTasks();

        if (autoRefresh) {
            const interval = setInterval(fetchTasks, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchTasks, autoRefresh]);

    // Generate AI review
    const generateAIReview = useCallback(async () => {
        setAiLoading(true);
        setAiReview(null);
        try {
            const res = await fetch("/api/ai/active-tasks-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectKey: selectedProject,
                    userId: selectedUser,
                    language,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate AI review");

            setAiReview(data.review);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAiLoading(false);
        }
    }, [selectedProject, selectedUser, language]);

    // Prepare chart data
    const statusChartData = insights
        ? Object.entries(insights.byStatus).map(([name, value]) => ({ name, value }))
        : [];

    const priorityChartData = insights
        ? Object.entries(insights.byPriority).map(([name, value]) => ({ name, value }))
        : [];

    const assigneeChartData = insights
        ? Object.entries(insights.byAssignee)
            .map(([_, data]) => ({ name: data.displayName.split(' ').slice(-1)[0], fullName: data.displayName, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        : [];

    // Group tasks by assignee for display
    const tasksByAssignee: Record<string, ActiveTask[]> = {};
    tasks.forEach(task => {
        const id = task.assignee.accountId;
        if (!tasksByAssignee[id]) {
            tasksByAssignee[id] = [];
        }
        tasksByAssignee[id].push(task);
    });

    const sortedAssignees = Object.entries(tasksByAssignee).sort((a, b) => b[1].length - a[1].length);

    // renderMarkdown removed in favor of ReactMarkdown

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return vi ? "Vừa xong" : "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return vi ? `${minutes} phút trước` : `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return vi ? `${hours} giờ trước` : `${hours}h ago`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {(t as any).activeTasks?.pageTitle || (vi ? "Tổng quan Công việc Đang thực hiện" : "Active Tasks Overview")}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {(t as any).activeTasks?.description || (vi ? "Xem tổng quan công việc đang được xử lý theo thời gian thực" : "Real-time overview of tasks currently in progress")}
                        </p>
                    </div>

                    {/* Filters and Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Project Filter */}
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder={(t as any).activeTasks?.filterByProject || "Project"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{(t as any).activeTasks?.allProjects || "All Projects"}</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* User Filter */}
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder={(t as any).activeTasks?.filterByUser || "User"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{(t as any).activeTasks?.allUsers || "All Users"}</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.accountId} value={u.accountId}>{u.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Auto Refresh Toggle */}
                        <Button
                            variant={autoRefresh ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                            {(t as any).activeTasks?.autoRefresh || "Auto"}
                        </Button>

                        {/* Manual Refresh */}
                        <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            )}

            {/* If embedded and Header is hidden, still show filters */}
            {hideHeader && (
                <div className="flex items-center justify-between gap-4 py-2 border-b">
                     <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">{vi ? "Công việc Đang thực hiện" : "Active Tasks"}</h2>
                     </div>
                     <div className="flex items-center gap-3 flex-wrap">
                        {/* User Filter */}
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder={(t as any).activeTasks?.filterByUser || "User"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{(t as any).activeTasks?.allUsers || "All Users"}</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.accountId} value={u.accountId}>{u.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Auto Refresh Toggle */}
                        <Button
                            variant={autoRefresh ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                            {(t as any).activeTasks?.autoRefresh || "Auto"}
                        </Button>

                        {/* Manual Refresh */}
                        <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                    {(t as any).activeTasks?.lastUpdated || "Last updated"}: {formatTimeAgo(lastUpdated)}
                </p>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && !insights && (
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                                <div className="h-8 bg-muted rounded w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats Cards */}
            {insights && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-indigo-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {(t as any).activeTasks?.totalActive || "Total Active"}
                                    </p>
                                    <p className="text-2xl font-bold">{insights.totalTasks}</p>
                                </div>
                                <Activity className="h-8 w-8 text-indigo-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 ${insights.overdueTasks > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {(t as any).activeTasks?.overdue || "Overdue"}
                                    </p>
                                    <p className={`text-2xl font-bold ${insights.overdueTasks > 0 ? 'text-red-600' : ''}`}>
                                        {insights.overdueTasks}
                                    </p>
                                </div>
                                <AlertTriangle className={`h-8 w-8 opacity-50 ${insights.overdueTasks > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 ${insights.highPriorityTasks > 3 ? 'border-l-orange-500' : 'border-l-amber-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {(t as any).activeTasks?.highPriority || "High Priority"}
                                    </p>
                                    <p className="text-2xl font-bold">{insights.highPriorityTasks}</p>
                                </div>
                                <Flame className="h-8 w-8 text-orange-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {(t as any).activeTasks?.avgTimeInStatus || "Avg Time in Status"}
                                    </p>
                                    <p className="text-2xl font-bold">{insights.avgTimeInStatus}h</p>
                                </div>
                                <Timer className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {insights && insights.totalTasks > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Status Distribution (Bar Chart instead of Pie) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                {(t as any).activeTasks?.byStatus || "By Status"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={statusChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Priority Distribution (Bar Chart instead of Pie) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                {(t as any).activeTasks?.byPriority || "By Priority"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={priorityChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {priorityChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Assignee Workload */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                {(t as any).activeTasks?.byAssignee || "By Assignee"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={assigneeChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                                    <Tooltip
                                        labelFormatter={(label) => {
                                            const item = assigneeChartData.find(d => d.name === label);
                                            return item?.fullName || label;
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Task List by Assignee */}
            {tasks.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <CardTitle className="text-base">
                                    {vi ? "Công việc theo Người thực hiện" : "Tasks by Assignee"}
                                </CardTitle>
                            </div>
                            <Badge variant="outline">{tasks.length} {(t as any).activeTasks?.tasks || "tasks"}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-6">
                                {sortedAssignees.map(([assigneeId, assigneeTasks]) => {
                                    const assignee = assigneeTasks[0].assignee;
                                    return (
                                        <motion.div
                                            key={assigneeId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            {/* Assignee Header */}
                                            <div className="flex items-center gap-3 pb-2 border-b">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={assignee.avatarUrl} alt={assignee.displayName} />
                                                    <AvatarFallback>
                                                        {assignee.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{assignee.displayName}</p>
                                                </div>
                                                <Badge variant="secondary">{assigneeTasks.length}</Badge>
                                            </div>

                                            {/* Tasks */}
                                            <div className="space-y-2 ml-11">
                                                {assigneeTasks.map(task => {
                                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                                                    const isHighPriority = ['Highest', 'High', 'Critical', 'Blocker'].includes(task.priority.name);
                                                    const isStuck = task.timeInStatus && task.timeInStatus > 48;

                                                    return (
                                                        <div
                                                            key={task.issueKey}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                                                                    isStuck ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
                                                                        'bg-muted/30 hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            {/* Issue Type Icon */}
                                                            {task.issueType.iconUrl && (
                                                                <img src={task.issueType.iconUrl} alt={task.issueType.name} className="h-4 w-4 mt-0.5" />
                                                            )}

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <a
                                                                        href={`https://your-domain.atlassian.net/browse/${task.issueKey}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="font-mono text-xs font-medium text-primary hover:underline"
                                                                    >
                                                                        {task.issueKey}
                                                                    </a>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[10px] px-1.5 py-0"
                                                                        style={{
                                                                            borderColor: STATUS_COLORS[task.status.colorName] || STATUS_COLORS.default,
                                                                            color: STATUS_COLORS[task.status.colorName] || STATUS_COLORS.default
                                                                        }}
                                                                    >
                                                                        {task.status.name}
                                                                    </Badge>
                                                                    {isHighPriority && (
                                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                                            {task.priority.name}
                                                                        </Badge>
                                                                    )}
                                                                    {isOverdue && (
                                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                                                                            OVERDUE
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-foreground truncate mt-1">{task.summary}</p>
                                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                                    <span>{task.project.key}</span>
                                                                    {task.timeInStatus !== undefined && (
                                                                        <span className={`flex items-center gap-1 ${task.timeInStatus > 48 ? 'text-amber-600' : ''}`}>
                                                                            <Clock className="h-3 w-3" />
                                                                            {task.timeInStatus}h
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!loading && tasks.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center py-16">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">
                            {(t as any).activeTasks?.noTasks || "No tasks currently in progress"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* AI Review Section */}
            {insights && insights.totalTasks > 0 && (
                <Card className="border-dashed border-primary/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        {(t as any).activeTasks?.aiReviewTitle || (vi ? "Đánh giá Công việc bằng AI" : "AI Task Review")}
                                    </CardTitle>
                                    <CardDescription>
                                        {vi
                                            ? "Phân tích tình trạng công việc và đề xuất hành động"
                                            : "Analyze workflow status and suggest actions"}
                                    </CardDescription>
                                </div>
                            </div>
                            {aiReview && (
                                <Button variant="ghost" size="icon" onClick={() => setAiExpanded(!aiExpanded)}>
                                    {aiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={generateAIReview}
                            disabled={aiLoading}
                            className="gap-2 mb-4"
                            variant="outline"
                        >
                            {aiLoading ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" />{(t as any).activeTasks?.generating || "Analyzing..."}</>
                            ) : (
                                <><Sparkles className="h-4 w-4" />{(t as any).activeTasks?.generateAIReview || "Generate AI Review"}</>
                            )}
                        </Button>

                        {aiLoading && (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-full" />
                                <div className="h-4 bg-muted rounded w-5/6" />
                                <div className="h-4 bg-muted rounded w-2/3" />
                            </div>
                        )}

                        <AnimatePresence>
                            {aiReview && aiExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 border text-sm overflow-hidden"
                                >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {aiReview}
                                    </ReactMarkdown>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
