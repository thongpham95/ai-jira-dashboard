import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        const projects = await getProjects({ accessToken, cloudId });
        return NextResponse.json(projects);
    } catch (error: any) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
    }
}
