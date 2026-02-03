import { NextResponse } from 'next/server';
import { getJiraClient } from '@/lib/jira';

export async function GET() {
    try {
        const host = process.env.JIRA_HOST;
        const email = process.env.JIRA_EMAIL;
        const token = process.env.JIRA_API_TOKEN;

        if (!host || !email || !token) {
            return NextResponse.json({
                host: host || '',
                email: email || '',
                connected: false,
                message: 'Missing credentials in environment variables.'
            });
        }

        // Test connection
        try {
            const jira = getJiraClient();
            await jira.getCurrentUser();
            return NextResponse.json({
                host,
                email,
                connected: true,
                message: 'Connected successfully.'
            });
        } catch (e: any) {
            return NextResponse.json({
                host,
                email,
                connected: false,
                message: e.message || 'Failed to connect to Jira.'
            });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
