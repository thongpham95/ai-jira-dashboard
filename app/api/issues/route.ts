import { NextResponse } from 'next/server';
import { searchJira, searchAllJira } from '@/lib/jira';

export async function POST(request: Request) {
    try {
        const { jql, startAt = 0, maxResults = 50, fields, fetchAll = false } = await request.json();

        // Default fields if not specified
        const searchFields = fields || [
            "summary",
            "status",
            "priority",
            "assignee",
            "project",
            "created",
            "updated",
            "duedate",
            "timeoriginalestimate",
            "timespent",
            "worklog",
            "issuetype",
            "parent"
        ];

        const searchFn = fetchAll ? searchAllJira : searchJira;
        const results = await searchFn(jql, {
            startAt,
            maxResults,
            fields: searchFields
        });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("Error searching issues:", error);
        return NextResponse.json({ error: error.message || 'Failed to search issues' }, { status: 500 });
    }
}
