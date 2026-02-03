import { NextResponse } from 'next/server';
import { getJiraClient } from '@/lib/jira';

export async function GET() {
    try {
        const jira = getJiraClient();
        const projects = await jira.listProjects();
        return NextResponse.json(projects);
    } catch (error: any) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
    }
}
