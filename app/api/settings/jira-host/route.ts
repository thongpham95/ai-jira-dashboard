import { NextResponse } from 'next/server';

export async function GET() {
    const host = process.env.JIRA_HOST || '';
    return NextResponse.json({ host });
}
