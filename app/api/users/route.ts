import { NextResponse } from 'next/server';

const host = process.env.JIRA_HOST;
const username = process.env.JIRA_EMAIL;
const password = process.env.JIRA_API_TOKEN;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const projectKey = searchParams.get('project');

        if (!host || !username || !password) {
            return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 500 });
        }

        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        let users: any[] = [];

        if (projectKey && projectKey !== 'all') {
            // Use REST API directly for assignable users by project
            const url = new URL(`${host}/rest/api/3/user/assignable/search`);
            url.searchParams.set('project', projectKey);
            url.searchParams.set('maxResults', '1000');

            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                users = Array.isArray(data) ? data : [];
            } else {
                // Fallback to general user search
                const fallbackUrl = new URL(`${host}/rest/api/3/user/search`);
                fallbackUrl.searchParams.set('query', query || '.');
                fallbackUrl.searchParams.set('maxResults', '1000');

                const fallbackRes = await fetch(fallbackUrl.toString(), {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Accept': 'application/json'
                    }
                });
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    users = Array.isArray(data) ? data : [];
                }
            }
        } else {
            // General user search
            const url = new URL(`${host}/rest/api/3/user/search`);
            url.searchParams.set('query', query || '.');
            url.searchParams.set('maxResults', '1000');

            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                users = Array.isArray(data) ? data : [];
            }
        }

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
}
