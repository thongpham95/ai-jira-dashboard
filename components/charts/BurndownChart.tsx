"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BurndownChartProps {
    data: {
        date: string;
        remaining: number;
        ideal: number;
    }[];
    title?: string;
}

export function BurndownChart({ data, title = "Sprint Burndown" }: BurndownChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" name="Ideal Guideline" dot={false} />
                        <Line type="monotone" dataKey="remaining" stroke="var(--chart-1)" strokeWidth={2} activeDot={{ r: 8 }} name="Remaining Effort" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
