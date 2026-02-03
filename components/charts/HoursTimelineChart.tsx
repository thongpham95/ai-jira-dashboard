"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HoursTimelineChartProps {
    data: { week: string; hours: number }[];
    title?: string;
}

export function HoursTimelineChart({ data, title = "Hours Logged Over Time" }: HoursTimelineChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                                formatter={(value) => [`${value}h`, 'Thời gian']}
                            />
                            <Area
                                type="monotone"
                                dataKey="hours"
                                stroke="var(--chart-2)"
                                fill="var(--chart-2)"
                                fillOpacity={0.3}
                                name="Thời gian"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        Chưa có dữ liệu.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
