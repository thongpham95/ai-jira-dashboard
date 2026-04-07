"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3, TrendingUp, AlertTriangle, Clock, Users, CheckCircle2,
    RefreshCw, Sparkles, ChevronDown, ChevronUp, Shield, Bug,
    Activity, Zap, Target, XCircle
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Legend
} from "recharts";

interface MemberPerformanceMetrics {
    userId: string;
    userName: string;
    role: string;
    cycleTimes: {
        issueKey: string;
        issueSummary: string;
        durationHours: number;
    }[];
    avgCycleTimeHours: number;
    medianCycleTimeHours: number;
    minCycleTimeHours: number;
    maxCycleTimeHours: number;
    totalIssuesCompleted: number;
    totalStoryPoints: number;
    firstTimePassRate: number;
    reopenCount: number;
    totalReviewedOrTested: number;
    anomalies: {
        type: string;
        severity: string;
        message: string;
        issueKey?: string;
        value?: number;
        threshold?: number;
    }[];
}

interface PerformanceData {
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

interface PerformanceDashboardProps {
    projectKey?: string;
    projectName?: string;
}

const ROLE_COLORS = {
    developer: { primary: '#6366f1', bg: 'from-indigo-500/10 to-violet-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    tech_lead: { primary: '#f59e0b', bg: 'from-amber-500/10 to-yellow-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    qc: { primary: '#10b981', bg: 'from-emerald-500/10 to-teal-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
};

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#4f46e5', '#818cf8'];

export function PerformanceDashboard({ projectKey, projectName }: PerformanceDashboardProps) {
    const { language } = useLanguage();
    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("developer");

    // Date range - default: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    // AI Review state
    const [aiReview, setAiReview] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExpanded, setAiExpanded] = useState(true);

    const fetchPerformance = useCallback(async () => {
        setLoading(true);
        setError(null);
        setData(null);
        setAiReview(null);

        try {
            const res = await fetch("/api/performance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectKey: projectKey || "all",
                    startDate,
                    endDate,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to fetch performance data");
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectKey, startDate, endDate]);

    const generateAIReview = useCallback(async () => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/performance-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectKey: projectKey || "all",
                    startDate,
                    endDate,
                    role: activeTab,
                    language,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to generate AI review");
            setAiReview(result.review);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAiLoading(false);
        }
    }, [projectKey, startDate, endDate, activeTab, language]);

    const getRoleMembers = (role: string): MemberPerformanceMetrics[] => {
        if (!data) return [];
        if (role === "developer") return data.developers;
        if (role === "tech_lead") return data.techLeads;
        if (role === "qc") return data.qcMembers;
        return [];
    };

    const members = getRoleMembers(activeTab);
    const roleColors = ROLE_COLORS[activeTab as keyof typeof ROLE_COLORS] || ROLE_COLORS.developer;

    // Chart data
    const cycleTimeChartData = members.map(m => ({
        name: m.userName.split(' ').slice(-1)[0], // Last name
        fullName: m.userName,
        avg: m.avgCycleTimeHours,
        median: m.medianCycleTimeHours,
        max: m.maxCycleTimeHours,
        issues: m.totalIssuesCompleted,
    }));

    const qualityChartData = members.map(m => ({
        name: m.userName.split(' ').slice(-1)[0],
        fullName: m.userName,
        passRate: m.firstTimePassRate,
        reopens: m.reopenCount,
        total: m.totalIssuesCompleted,
    }));

    const throughputChartData = members.map(m => ({
        name: m.userName.split(' ').slice(-1)[0],
        fullName: m.userName,
        issues: m.totalIssuesCompleted,
        storyPoints: m.totalStoryPoints,
    }));

    // Aggregate anomalies across all members
    const allAnomalies = members.flatMap(m =>
        m.anomalies.map(a => ({ ...a, memberName: m.userName }))
    );

    // Total stats
    const totalIssues = members.reduce((s, m) => s + m.totalIssuesCompleted, 0);
    const avgPassRate = members.length > 0
        ? Math.round(members.reduce((s, m) => s + m.firstTimePassRate, 0) / members.length)
        : 0;
    const avgCycleTime = members.length > 0
        ? Math.round(members.reduce((s, m) => s + m.avgCycleTimeHours, 0) / members.length * 10) / 10
        : 0;

    const getAveragesForTab = (tab: string) => {
        if (!data?.teamAverages) return null;
        if (tab === "tech_lead") return data.teamAverages.techLead;
        if (tab === "qc") return data.teamAverages.qc;
        return data.teamAverages.developer;
    };
    
    const roleAverages = getAveragesForTab(activeTab);

    const vi = language === "vi";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {vi ? "Đánh giá Hiệu suất" : "Performance Evaluation"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {projectName
                            ? (vi ? `Dự án: ${projectName}` : `Project: ${projectName}`)
                            : (vi ? "Tất cả dự án" : "All Projects")}
                    </p>
                </div>

                {/* Date range + Fetch */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <Button onClick={fetchPerformance} disabled={loading} className="gap-2">
                        {loading ? (
                            <><RefreshCw className="h-4 w-4 animate-spin" />{vi ? "Đang tải..." : "Loading..."}</>
                        ) : (
                            <><BarChart3 className="h-4 w-4" />{vi ? "Phân tích" : "Analyze"}</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
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

            {/* Main Content */}
            {data && !loading && (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-indigo-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {vi ? "Issues phân tích" : "Issues Analyzed"}
                                        </p>
                                        <p className="text-2xl font-bold">{data.totalIssuesAnalyzed}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-indigo-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-emerald-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {vi ? "Issues hoàn thành" : "Issues Completed"}
                                        </p>
                                        <p className="text-2xl font-bold">{totalIssues}</p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {vi ? "Cycle Time TB" : "Avg Cycle Time"}
                                        </p>
                                        <p className="text-2xl font-bold">{avgCycleTime}h</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-amber-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`border-l-4 ${avgPassRate >= 80 ? 'border-l-emerald-500' : avgPassRate >= 60 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {vi ? "Tỉ lệ Pass lần đầu" : "First Time Pass Rate"}
                                        </p>
                                        <p className={`text-2xl font-bold ${avgPassRate >= 80 ? 'text-emerald-600' : avgPassRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {avgPassRate}%
                                        </p>
                                    </div>
                                    <Target className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Anomalies Banner */}
                    {allAnomalies.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        <CardTitle className="text-base text-red-700 dark:text-red-400">
                                            {vi ? `${allAnomalies.length} Điểm bất thường phát hiện` : `${allAnomalies.length} Anomalies Detected`}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {allAnomalies.slice(0, 5).map((a, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-start gap-2 text-sm p-2 rounded-md ${a.severity === 'critical'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                                    }`}
                                            >
                                                {a.severity === 'critical' ? (
                                                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                )}
                                                <span>
                                                    <strong>{(a as any).memberName}:</strong> {a.message}
                                                </span>
                                            </div>
                                        ))}
                                        {allAnomalies.length > 5 && (
                                            <p className="text-xs text-muted-foreground ml-6">
                                                {vi ? `... và ${allAnomalies.length - 5} cảnh báo khác` : `... and ${allAnomalies.length - 5} more`}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Role Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="developer" className="gap-2">
                                <Zap className="h-4 w-4" />
                                Developer ({data.developers.length})
                            </TabsTrigger>
                            <TabsTrigger value="tech_lead" className="gap-2">
                                <Shield className="h-4 w-4" />
                                Tech Lead ({data.techLeads.length})
                            </TabsTrigger>
                            <TabsTrigger value="qc" className="gap-2">
                                <Bug className="h-4 w-4" />
                                QC ({data.qcMembers.length})
                            </TabsTrigger>
                        </TabsList>

                        {["developer", "tech_lead", "qc"].map(role => (
                            <TabsContent key={role} value={role} className="space-y-6">
                                {getRoleMembers(role).length === 0 ? (
                                    <Card>
                                        <CardContent className="pt-6 text-center text-muted-foreground py-12">
                                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p>{vi ? "Không có dữ liệu cho vai trò này trong khoảng thời gian đã chọn" : "No data for this role in the selected date range"}</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        {/* Charts Grid */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {/* Cycle Time Chart */}
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        {vi ? "Cycle Time trung bình (giờ)" : "Avg Cycle Time (hours)"}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {role === 'developer' ? 'TODO → CODE REVIEW' :
                                                            role === 'tech_lead' ? 'CODE REVIEW → MERGED TO QC' :
                                                                'TASK DONE → CLOSED/REOPEN'}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <BarChart data={cycleTimeChartData}>
                                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                            <YAxis tick={{ fontSize: 12 }} />
                                                            <Tooltip
                                                                formatter={(value: any) => [`${value}h`, vi ? "Cycle Time" : "Cycle Time"]}
                                                                labelFormatter={(label: any) => {
                                                                    const item = cycleTimeChartData.find(d => d.name === label);
                                                                    return item?.fullName || label;
                                                                }}
                                                            />
                                                            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                                                                {cycleTimeChartData.map((entry, index) => {
                                                                    // Highlight slow entries
                                                                    const threshold = role === 'tech_lead' ? 24 : role === 'qc' ? 24 : 48;
                                                                    const color = entry.avg > threshold ? '#ef4444' : entry.avg > threshold * 0.7 ? '#f59e0b' : BAR_COLORS[index % BAR_COLORS.length];
                                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                                })}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Quality / Pass Rate Chart */}
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Target className="h-4 w-4" />
                                                        {vi ? "Tỉ lệ Pass lần đầu (%)" : "First Time Pass Rate (%)"}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {vi ? "% task không bị reopen" : "% tasks not reopened"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <BarChart data={qualityChartData}>
                                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                                            <Tooltip
                                                                formatter={(value: any, name: any) => {
                                                                    if (name === 'passRate') return [`${value}%`, vi ? "Pass Rate" : "Pass Rate"];
                                                                    return [value, name];
                                                                }}
                                                                labelFormatter={(label: any) => {
                                                                    const item = qualityChartData.find(d => d.name === label);
                                                                    return item?.fullName || label;
                                                                }}
                                                            />
                                                            <Bar dataKey="passRate" radius={[4, 4, 0, 0]}>
                                                                {qualityChartData.map((entry, index) => {
                                                                    const color = entry.passRate >= 80 ? '#10b981' : entry.passRate >= 60 ? '#f59e0b' : '#ef4444';
                                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                                })}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Throughput Chart */}
                                            <Card className="md:col-span-2">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <TrendingUp className="h-4 w-4" />
                                                        {vi ? "Khối lượng công việc" : "Throughput"}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {vi ? "Số issues hoàn thành & Story Points" : "Issues completed & Story Points"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <BarChart data={throughputChartData}>
                                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                            <YAxis tick={{ fontSize: 12 }} />
                                                            <Tooltip
                                                                labelFormatter={(label) => {
                                                                    const item = throughputChartData.find(d => d.name === label);
                                                                    return item?.fullName || label;
                                                                }}
                                                            />
                                                            <Legend />
                                                            <Bar dataKey="issues" name={vi ? "Issues" : "Issues"} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="storyPoints" name={vi ? "Story Points" : "Story Points"} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Member Detail Table */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    {vi ? "Chi tiết thành viên" : "Member Details"}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b text-left">
                                                                <th className="p-3 font-medium">{vi ? "Thành viên" : "Member"}</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Issues" : "Issues"}</th>
                                                                <th className="p-3 font-medium text-center">SP</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Cycle TB" : "Avg Cycle"}</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Median" : "Median"}</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Pass Rate" : "Pass Rate"}</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Reopens" : "Reopens"}</th>
                                                                <th className="p-3 font-medium text-center">{vi ? "Cảnh báo" : "Alerts"}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {getRoleMembers(role).map((m) => (
                                                                <tr key={m.userId} className="border-b hover:bg-muted/50 transition-colors">
                                                                    <td className="p-3 font-medium">{m.userName}</td>
                                                                    <td className="p-3 text-center">{m.totalIssuesCompleted}</td>
                                                                    <td className="p-3 text-center">{m.totalStoryPoints}</td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex flex-col items-center">
                                                                            <span>{m.avgCycleTimeHours}h</span>
                                                                            <span>{m.avgCycleTimeHours}h</span>
                                                                            {roleAverages && roleAverages.avgCycleTimeHours !== undefined && (
                                                                                <span className={`text-[10px] ${
                                                                                    m.avgCycleTimeHours > roleAverages.avgCycleTimeHours 
                                                                                        ? 'text-red-500' 
                                                                                        : 'text-emerald-500'
                                                                                }`}>
                                                                                    {m.avgCycleTimeHours > roleAverages.avgCycleTimeHours ? '↑' : '↓'} 
                                                                                    TB: {roleAverages.avgCycleTimeHours}h
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-center">{m.medianCycleTimeHours}h</td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className={`font-medium ${m.firstTimePassRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : m.firstTimePassRate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                                {m.firstTimePassRate}%
                                                                            </span>
                                                                            {roleAverages && (roleAverages as any).firstTimePassRate !== undefined && (
                                                                                <span className={`text-[10px] ${
                                                                                    m.firstTimePassRate < (roleAverages as any).firstTimePassRate 
                                                                                        ? 'text-red-500' 
                                                                                        : 'text-emerald-500'
                                                                                }`}>
                                                                                    {m.firstTimePassRate < (roleAverages as any).firstTimePassRate ? '↓' : '↑'}
                                                                                    TB: {(roleAverages as any).firstTimePassRate}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {m.reopenCount > 0 ? (
                                                                            <span className="text-red-600 dark:text-red-400 font-medium">{m.reopenCount}</span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">0</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {m.anomalies.length > 0 ? (
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.anomalies.some(a => a.severity === 'critical')
                                                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                                }`}>
                                                                                <AlertTriangle className="h-3 w-3" />
                                                                                {m.anomalies.length}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                                <CheckCircle2 className="h-3 w-3" />
                                                                                OK
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* AI Performance Review */}
                    <Card className="border-dashed border-primary/20">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">
                                            {vi ? "AI Đánh giá Hiệu suất" : "AI Performance Review"}
                                        </CardTitle>
                                        <CardDescription>
                                            {vi
                                                ? "Tạo nhận xét tự động dựa trên dữ liệu metrics"
                                                : "Generate automated review based on metrics data"}
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
                                    <><RefreshCw className="h-4 w-4 animate-spin" />{vi ? "Đang phân tích..." : "Analyzing..."}</>
                                ) : (
                                    <><Sparkles className="h-4 w-4" />{vi ? "Tạo nhận xét AI" : "Generate AI Review"}</>
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
                </>
            )}

            {/* Empty state */}
            {!data && !loading && !error && (
                <Card>
                    <CardContent className="pt-6 text-center py-16">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground mb-4">
                            {vi
                                ? "Chọn khoảng thời gian và nhấn 'Phân tích' để bắt đầu"
                                : "Select a date range and click 'Analyze' to start"}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
