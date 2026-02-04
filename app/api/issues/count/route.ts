import { NextResponse } from 'next/server';
import { countJira } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
    try {
        const { jql } = await request.json();

        if (!jql) {
            return NextResponse.json({ error: 'JQL query is required' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        const total = await countJira(jql, { accessToken, cloudId });
        return NextResponse.json({ total });
    } catch (error: any) {
        console.error("Error counting issues:", error);
        return NextResponse.json({ error: error.message || 'Failed to count issues' }, { status: 500 });
    }
}
