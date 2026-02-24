import { NextResponse } from 'next/server';
import { testGeminiConnection, type GeminiModel } from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const { apiKey, model } = await request.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
        }

        const success = await testGeminiConnection(apiKey, model as GeminiModel);

        return NextResponse.json({ success });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Connection test failed' },
            { status: 500 }
        );
    }
}
