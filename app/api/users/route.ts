import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { withCache, createCacheKey, CACHE_TTL } from '@/lib/cache';

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

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use cache for users (rarely changes)
        const cacheKey = createCacheKey('users', { cloudId, projectKey, query });
        const users = await withCache(
            cacheKey,
            () => getUsers({ accessToken, cloudId, projectKey, query }),
            { ttlMs: CACHE_TTL.USERS }
        );

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
}
