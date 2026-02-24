import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getProjects } from '@/lib/jira';
import {
    convertNaturalLanguageToJQL,
    type GeminiModel,
} from '@/lib/ai';

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
        const { query, model, language } = body;

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        // Fetch available project keys for context
        let projectKeys: string[] = [];
        try {
            const projects = await getProjects({ accessToken, cloudId });
            projectKeys = projects.map((p: any) => p.key);
        } catch (e) {
            console.warn('Could not fetch projects for context:', e);
        }

        const jql = await convertNaturalLanguageToJQL({
            naturalLanguage: query,
            projectKeys,
            model: model as GeminiModel,
            language: language || 'vi',
        });

        return NextResponse.json({
            jql,
            metadata: {
                originalQuery: query,
                generatedAt: new Date().toISOString(),
                model: model || 'gemini-2.5-flash',
                projectKeysUsed: projectKeys,
            },
        });
    } catch (error: any) {
        console.error('JQL Conversion Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to convert to JQL' },
            { status: 500 }
        );
    }
}
