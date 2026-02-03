import { NextResponse } from 'next/server';
import { countJira } from '@/lib/jira';

export async function POST(request: Request) {
    try {
        const { jql } = await request.json();

        if (!jql) {
            return NextResponse.json({ error: 'JQL query is required' }, { status: 400 });
        }

        const total = await countJira(jql);
        return NextResponse.json({ total });
    } catch (error: any) {
        console.error("Error counting issues:", error);
        return NextResponse.json({ error: error.message || 'Failed to count issues' }, { status: 500 });
    }
}
