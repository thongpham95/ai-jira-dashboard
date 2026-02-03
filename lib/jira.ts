import JiraClient from 'jira-client';

const host = process.env.JIRA_HOST;
const email = process.env.JIRA_EMAIL; // Not used by jira-client directly in basic_auth usually, but for API token auth
const username = process.env.JIRA_EMAIL; // jira-client uses 'username' which is email
const password = process.env.JIRA_API_TOKEN;

if (!host || !username || !password) {
    console.warn("Jira credentials (JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN) are missing in .env.local");
}

// Singleton instance
let jira: JiraClient | null = null;

export const getJiraClient = () => {
    if (jira) return jira;

    // jira-client expects protocol provided, or defaults to https if not?
    // It parses the host. simpler to pass strict config.

    // Validation
    if (!host || !username || !password) {
        throw new Error("Missing Jira credentials");
    }

    // Handle URL parsing to get protocol, host, port if needed.
    // jira-client constructor: { protocol, host, port, username, password, api_version, strictSSL }
    const url = new URL(host);

    jira = new JiraClient({
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        username: username,
        password: password,
        apiVersion: '3',
        strictSSL: true
    });

    return jira;
};

export const searchJira = async (jql: string, options: any = {}) => {
    if (!host || !username || !password) throw new Error("Missing credentials");

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    // Using new /rest/api/3/search/jql endpoint (migrated from deprecated /rest/api/3/search)
    // New API format: jql, fields, maxResults, nextPageToken (instead of startAt)
    const body: any = {
        jql,
        maxResults: Math.max(options.maxResults ?? 50, 1),
        fields: options.fields || ['summary', 'status', 'assignee', 'project', 'issuetype', 'priority', 'created', 'updated'],
    };

    // Add expand if needed
    if (options.expand) {
        body.expand = options.expand;
    }

    // Use nextPageToken for pagination if provided
    if (options.nextPageToken) {
        body.nextPageToken = options.nextPageToken;
    }

    const res = await fetch(`${host}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const txt = await res.text();
        console.error("Jira API Search Error:", txt);
        throw new Error(`Jira API Error ${res.status}: ${txt}`);
    }

    return await res.json();
};

/**
 * Search all issues matching a JQL query, paginating through all results.
 * Returns a combined result with all issues from all pages.
 */
export const searchAllJira = async (jql: string, options: any = {}): Promise<any> => {
    const allIssues: any[] = [];
    let nextPageToken: string | undefined;
    let isLast = false;
    const maxResults = Math.min(options.maxResults ?? 5000, 5000);

    while (!isLast) {
        const pageOptions: any = {
            ...options,
            maxResults,
        };
        if (nextPageToken) {
            pageOptions.nextPageToken = nextPageToken;
        }

        const data = await searchJira(jql, pageOptions);
        const issues = data.issues || [];
        allIssues.push(...issues);
        nextPageToken = data.nextPageToken;
        isLast = data.isLast !== false;

        // Safety: stop at 1000 issues to avoid runaway requests
        if (allIssues.length >= 1000) break;
    }

    return { issues: allIssues };
};

/**
 * Count total issues matching a JQL query.
 * The new /search/jql API doesn't return a total count, so we paginate
 * with minimal fields to count all matching issues efficiently.
 */
export const countJira = async (jql: string): Promise<number> => {
    if (!host || !username || !password) throw new Error("Missing credentials");

    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    let count = 0;
    let nextPageToken: string | undefined;
    let isLast = false;

    while (!isLast) {
        const body: any = {
            jql,
            maxResults: 5000,
            fields: ['summary'], // minimal field to reduce payload
        };
        if (nextPageToken) {
            body.nextPageToken = nextPageToken;
        }

        const res = await fetch(`${host}/rest/api/3/search/jql`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Jira API Error ${res.status}: ${txt}`);
        }

        const data = await res.json();
        count += (data.issues || []).length;
        nextPageToken = data.nextPageToken;
        isLast = data.isLast !== false;
    }

    return count;
};

