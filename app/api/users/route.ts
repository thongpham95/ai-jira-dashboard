import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const projectKey = searchParams.get('project') || undefined;

        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        const users = await getUsers({
            accessToken,
            cloudId,
            projectKey,
            query
        });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
}
