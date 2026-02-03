"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EfficiencyRadarChartProps {
    data: {
        subject: string;
        A: number; // Member
        B?: number; // Team Average
        fullMark: number;
    }[];
    title?: string;
}

export function EfficiencyRadarChart({ data, title = "Performance Radar" }: EfficiencyRadarChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" fontSize={12} stroke="#888888" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                            name="Cá nhân"
                            dataKey="A"
                            stroke="var(--chart-3)"
                            fill="var(--chart-3)"
                            fillOpacity={0.5}
                        />
                        <Radar
                            name="TB Team"
                            dataKey="B"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.3}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
