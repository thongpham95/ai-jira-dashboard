"use client";

import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkloadBarChartProps {
    projectId?: string; // Optional project filter
    title?: string;
}

export function WorkloadBarChart({ projectId, title = "Team Workload" }: WorkloadBarChartProps) {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWorklogs() {
            setLoading(true);
            try {
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30); // Last 30 days
                const startDateStr = startDate.toISOString().split('T')[0];

                const body: any = {
                    startDate: startDateStr,
                    endDate: endDate
                };

                if (projectId && projectId !== 'all') {
                    // Check if projectId looks like a Key or ID. 
                    // API expects 'projectIds' array.
                    // If projectId is a number string, it might be ID. 
                    // But usually project Key is safer for text search.
                    // The API implementation puts this into 'project in (...)' JQL.
                    // So Key or ID string works.
                    body.projectIds = [projectId];
                }

                const res = await fetch('/api/worklogs', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                const responseData = await res.json();

                if (responseData.worklogs) {
                    // Aggregate by Author
                    const agg: Record<string, number> = {};
                    responseData.worklogs.forEach((log: any) => {
                        const author = log.author?.displayName || 'Unknown';
                        const hours = (log.timeSpentSeconds || 0) / 3600;
                        agg[author] = (agg[author] || 0) + hours;
                    });

                    const chartData = Object.keys(agg).map(key => ({
                        name: key,
                        value: parseFloat(agg[key].toFixed(1))
                    })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10

                    setData(chartData);
                }
            } catch (e) {
                console.error("Failed to load workload", e);
            } finally {
                setLoading(false);
            }
        }

        fetchWorklogs();
    }, [projectId]);

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title} {projectId && projectId !== 'all' ? `(${projectId})` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {loading ? <Skeleton className="h-full w-full" /> : (
                    data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                />
                                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} name="Hours Logged" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                            No worklogs found for last 30 days.
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
