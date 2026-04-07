import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { clearCache, getCacheStats } from '@/lib/cache';

// GET - Get cache statistics
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const stats = getCacheStats();
        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Clear cache (all or by prefix)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const prefix = searchParams.get('prefix') || undefined;

        const cleared = clearCache(prefix);

        return NextResponse.json({
            success: true,
            message: prefix
                ? `Cleared ${cleared} cache entries with prefix "${prefix}"`
                : 'All cache entries cleared',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
