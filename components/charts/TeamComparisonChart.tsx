"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, Target, TrendingUp, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";

interface TeamMemberStats {
    userId: string;
    userName: string;
    avatarUrl?: string;
    metrics: {
        issuesCompleted: number;
        hoursLogged: number;
        avgCycleTimeHours: number;
        punctuality: number; // % on-time
        qualityScore: number; // 0-100
    };
}

interface TeamComparisonChartProps {
    projectKey?: string;
    startDate: string;
    endDate: string;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

export function TeamComparisonChart({ projectKey, startDate, endDate }: TeamComparisonChartProps) {
    const { language } = useLanguage();
    const [data, setData] = useState<TeamMemberStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [metric, setMetric] = useState<"issues" | "hours" | "cycleTime" | "quality">("issues");

    const vi = language === "vi";

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reports/team-comparison", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectKey, startDate, endDate }),
            });
            const result = await res.json();
            if (result.members) {
                setData(result.members);
            }
        } catch (err) {
            console.error("Failed to fetch team comparison data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, [projectKey, startDate, endDate]);

    // Prepare chart data based on selected metric
    const getBarChartData = () => {
        return data.map((member, index) => {
            const shortName = member.userName.split(' ').slice(-1)[0];
            switch (metric) {
                case "issues":
                    return {
                        name: shortName,
                        fullName: member.userName,
                        value: member.metrics.issuesCompleted,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                    };
                case "hours":
                    return {
                        name: shortName,
                        fullName: member.userName,
                        value: Math.round(member.metrics.hoursLogged * 10) / 10,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                    };
                case "cycleTime":
                    return {
                        name: shortName,
                        fullName: member.userName,
                        value: Math.round(member.metrics.avgCycleTimeHours * 10) / 10,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                    };
                case "quality":
                    return {
                        name: shortName,
                        fullName: member.userName,
                        value: member.metrics.qualityScore,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                    };
                default:
                    return {
                        name: shortName,
                        fullName: member.userName,
                        value: member.metrics.issuesCompleted,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                    };
            }
        }).sort((a, b) => b.value - a.value);
    };

    // Prepare radar chart data for overall comparison
    const getRadarChartData = () => {
        if (data.length === 0) return [];

        // Normalize metrics for radar chart
        const maxIssues = Math.max(...data.map(d => d.metrics.issuesCompleted)) || 1;
        const maxHours = Math.max(...data.map(d => d.metrics.hoursLogged)) || 1;
        const maxCycleTime = Math.max(...data.map(d => d.metrics.avgCycleTimeHours)) || 1;

        return data.slice(0, 5).map((member, index) => ({
            subject: member.userName.split(' ').slice(-1)[0],
            fullName: member.userName,
            issues: Math.round((member.metrics.issuesCompleted / maxIssues) * 100),
            hours: Math.round((member.metrics.hoursLogged / maxHours) * 100),
            cycleTime: Math.round(100 - (member.metrics.avgCycleTimeHours / maxCycleTime) * 100), // Inverse - lower is better
            punctuality: member.metrics.punctuality,
            quality: member.metrics.qualityScore,
            fill: CHART_COLORS[index % CHART_COLORS.length],
        }));
    };

    const barChartData = getBarChartData();
    const radarChartData = getRadarChartData();

    const metricLabels = {
        issues: vi ? "Issues hoàn thành" : "Issues Completed",
        hours: vi ? "Giờ ghi nhận" : "Hours Logged",
        cycleTime: vi ? "Cycle Time TB (giờ)" : "Avg Cycle Time (hrs)",
        quality: vi ? "Điểm chất lượng" : "Quality Score",
    };

    const getMetricUnit = () => {
        switch (metric) {
            case "issues": return vi ? " issues" : " issues";
            case "hours": return vi ? " giờ" : " hrs";
            case "cycleTime": return vi ? " giờ" : " hrs";
            case "quality": return "%";
            default: return "";
        }
    };

    // Calculate team averages
    const teamAvg = {
        issues: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.metrics.issuesCompleted, 0) / data.length) : 0,
        hours: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.metrics.hoursLogged, 0) / data.length * 10) / 10 : 0,
        cycleTime: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.metrics.avgCycleTimeHours, 0) / data.length * 10) / 10 : 0,
        quality: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.metrics.qualityScore, 0) / data.length) : 0,
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {vi ? "So sánh Nhóm" : "Team Comparison"}
                        </CardTitle>
                        <CardDescription>
                            {vi ? "So sánh hiệu suất giữa các thành viên" : "Compare performance across team members"}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchTeamData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-10 w-10 mb-3 opacity-30" />
                        <p>{vi ? "Không có dữ liệu nhóm" : "No team data available"}</p>
                    </div>
                ) : (
                    <Tabs defaultValue="bar" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="bar">{vi ? "Biểu đồ cột" : "Bar Chart"}</TabsTrigger>
                                <TabsTrigger value="radar">{vi ? "Radar" : "Radar"}</TabsTrigger>
                            </TabsList>

                            <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={vi ? "Chọn metric" : "Select metric"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="issues">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            {vi ? "Issues hoàn thành" : "Issues Completed"}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="hours">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {vi ? "Giờ ghi nhận" : "Hours Logged"}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="cycleTime">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {vi ? "Cycle Time" : "Cycle Time"}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="quality">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            {vi ? "Điểm chất lượng" : "Quality Score"}
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Average Banner */}
                        <div className="grid grid-cols-4 gap-2 bg-muted/50 rounded-lg p-3">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{vi ? "TB Issues" : "Avg Issues"}</p>
                                <p className="text-lg font-semibold">{teamAvg.issues}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{vi ? "TB Giờ" : "Avg Hours"}</p>
                                <p className="text-lg font-semibold">{teamAvg.hours}h</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{vi ? "TB Cycle" : "Avg Cycle"}</p>
                                <p className="text-lg font-semibold">{teamAvg.cycleTime}h</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{vi ? "TB Chất lượng" : "Avg Quality"}</p>
                                <p className="text-lg font-semibold">{teamAvg.quality}%</p>
                            </div>
                        </div>

                        <TabsContent value="bar" className="mt-0">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: any) => [`${value}${getMetricUnit()}`, metricLabels[metric]]}
                                        labelFormatter={(label) => {
                                            const item = barChartData.find(d => d.name === label);
                                            return item?.fullName || label;
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {barChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="radar" className="mt-0">
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarChartData.length > 0 ? [
                                    { metric: vi ? "Issues" : "Issues", ...Object.fromEntries(radarChartData.map(d => [d.subject, d.issues])) },
                                    { metric: vi ? "Giờ" : "Hours", ...Object.fromEntries(radarChartData.map(d => [d.subject, d.hours])) },
                                    { metric: vi ? "Tốc độ" : "Speed", ...Object.fromEntries(radarChartData.map(d => [d.subject, d.cycleTime])) },
                                    { metric: vi ? "Đúng hạn" : "Punctuality", ...Object.fromEntries(radarChartData.map(d => [d.subject, d.punctuality])) },
                                    { metric: vi ? "Chất lượng" : "Quality", ...Object.fromEntries(radarChartData.map(d => [d.subject, d.quality])) },
                                ] : []}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    {radarChartData.map((member, index) => (
                                        <Radar
                                            key={member.subject}
                                            name={member.fullName}
                                            dataKey={member.subject}
                                            stroke={member.fill}
                                            fill={member.fill}
                                            fillOpacity={0.2}
                                        />
                                    ))}
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}
