import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchPerformanceData } from '@/lib/jira-performance';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { projectKey, startDate, endDate, userIds } = body;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required (YYYY-MM-DD)' }, { status: 400 });
        }

        const result = await fetchPerformanceData({
            accessToken,
            cloudId,
            projectKey: projectKey || 'all',
            startDate,
            endDate,
            userIds: userIds || [],
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Performance API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch performance data' },
            { status: 500 }
        );
    }
}
