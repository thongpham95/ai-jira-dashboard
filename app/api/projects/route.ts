import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/jira';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { withCache, createCacheKey, CACHE_TTL } from '@/lib/cache';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use cache for projects (rarely changes)
        const cacheKey = createCacheKey('projects', { cloudId });
        const projects = await withCache(
            cacheKey,
            () => getProjects({ accessToken, cloudId }),
            { ttlMs: CACHE_TTL.PROJECTS }
        );

        return NextResponse.json(projects);
    } catch (error: any) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
    }
}
