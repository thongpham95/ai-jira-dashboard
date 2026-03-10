// Jira API client using OAuth 2.0 (3LO)
// OAuth tokens work with: https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...

// Helper to get Authorization header (OAuth only)
const getAuthorizationHeader = (accessToken?: string) => {
    if (accessToken) {
        return `Bearer ${accessToken}`;
    }
    throw new Error("Missing OAuth access token. Please login with Jira.");
};

export interface JiraAuthOptions {
    accessToken?: string;
    cloudId?: string;
}

const getBaseUrl = (options?: JiraAuthOptions) => {
    if (options?.accessToken && options?.cloudId) {
        return `https://api.atlassian.com/ex/jira/${options.cloudId}`;
    }
    throw new Error("Missing OAuth credentials (accessToken or cloudId). Please login with Jira.");
};

export const searchJira = async (jql: string, options: any = {}) => {
    const { accessToken, cloudId, ...queryOptions } = options;

    // Construct URL
    const baseUrl = getBaseUrl({ accessToken, cloudId });
    let apiUrl = `${baseUrl}/rest/api/3/search/jql`;

    // expand must be a query parameter, NOT in the POST body
    if (queryOptions.expand) {
        const expandStr = Array.isArray(queryOptions.expand) ? queryOptions.expand.join(',') : queryOptions.expand;
        apiUrl += `?expand=${encodeURIComponent(expandStr)}`;
    }

    const body: any = {
        jql,
        maxResults: Math.max(queryOptions.maxResults ?? 50, 1),
        fields: queryOptions.fields || ['summary', 'status', 'assignee', 'project', 'issuetype', 'priority', 'created', 'updated'],
    };

    if (queryOptions.nextPageToken) body.nextPageToken = queryOptions.nextPageToken;

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': getAuthorizationHeader(accessToken),
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

export const searchAllJira = async (jql: string, options: any = {}): Promise<any> => {
    const allIssues: any[] = [];
    let nextPageToken: string | undefined;
    let isLast = false;
    const maxResults = Math.min(options.maxResults ?? 5000, 5000);

    // Extract auth options to pass to every call
    const { accessToken, cloudId, ...queryOptions } = options;
    const authOptions = { accessToken, cloudId };

    while (!isLast) {
        const pageOptions: any = {
            ...queryOptions,
            ...authOptions,
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

        if (allIssues.length >= 2000) break; // Increased safety limit
    }

    return { issues: allIssues };
};

// Fetch changelog for a single issue (with retry for rate limits)
export const fetchIssueChangelog = async (issueKey: string, options: JiraAuthOptions, retries = 2): Promise<any[]> => {
    const { accessToken, cloudId } = options;
    const baseUrl = getBaseUrl({ accessToken, cloudId });
    const apiUrl = `${baseUrl}/rest/api/3/issue/${issueKey}/changelog`;

    const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': getAuthorizationHeader(accessToken),
            'Accept': 'application/json'
        },
    });

    if (res.status === 429 && retries > 0) {
        // Rate limited — wait and retry
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        return fetchIssueChangelog(issueKey, options, retries - 1);
    }

    if (!res.ok) {
        console.warn(`Changelog fetch failed for ${issueKey}: ${res.status}`);
        return [];
    }

    const data = await res.json();
    return data.values || [];
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Search issues then fetch changelogs individually (batched with rate limit handling)
export const searchAllJiraWithChangelog = async (jql: string, options: any = {}): Promise<any> => {
    const { accessToken, cloudId, ...queryOptions } = options;
    const authOpts = { accessToken, cloudId };

    // Step 1: Search issues (without changelog) using the standard endpoint
    const searchData = await searchAllJira(jql, {
        ...queryOptions,
        ...authOpts,
        expand: undefined, // Don't expand changelog in search
    });

    const issues = searchData.issues || [];
    console.log(`[PERF] Found ${issues.length} issues, fetching changelogs...`);

    // Step 2: Fetch changelogs in parallel batches (small batches + delay to avoid 429)
    const BATCH_SIZE = 5;
    for (let i = 0; i < issues.length; i += BATCH_SIZE) {
        const batch = issues.slice(i, i + BATCH_SIZE);
        const changelogs = await Promise.all(
            batch.map((issue: any) => fetchIssueChangelog(issue.key, authOpts))
        );

        // Attach changelogs to issues
        batch.forEach((issue: any, idx: number) => {
            issue.changelog = { histories: changelogs[idx] };
        });

        // Rate limit delay between batches
        if (i + BATCH_SIZE < issues.length) {
            await delay(200);
        }
    }

    console.log(`[PERF] Changelogs fetched for ${issues.length} issues`);
    return { issues, total: issues.length };
};

export const countJira = async (jql: string, options: JiraAuthOptions = {}): Promise<number> => {
    const { accessToken, cloudId } = options;
    // Note: options argument was not standard before, added for auth

    const baseUrl = getBaseUrl({ accessToken, cloudId });
    const apiUrl = `${baseUrl}/rest/api/3/search/jql`;

    let count = 0;
    let nextPageToken: string | undefined;
    let isLast = false;

    while (!isLast) {
        const body: any = {
            jql,
            maxResults: 5000,
            fields: ['summary'],
        };
        if (nextPageToken) {
            body.nextPageToken = nextPageToken;
        }

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': getAuthorizationHeader(accessToken),
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

export const getProjects = async (options: JiraAuthOptions = {}) => {
    const baseUrl = getBaseUrl(options);
    const res = await fetch(`${baseUrl}/rest/api/3/project`, {
        headers: {
            'Authorization': getAuthorizationHeader(options.accessToken),
            'Accept': 'application/json'
        }
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Jira API Error ${res.status}: ${txt}`);
    }
    return await res.json();
};

export const getUsers = async (options: JiraAuthOptions & { projectKey?: string, query?: string } = {}) => {
    const baseUrl = getBaseUrl(options);
    const { projectKey, query } = options;
    let url = `${baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(query || '.')}&maxResults=1000`;

    if (projectKey && projectKey !== 'all') {
        url = `${baseUrl}/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=1000`;
    }

    const res = await fetch(url, {
        headers: {
            'Authorization': getAuthorizationHeader(options.accessToken),
            'Accept': 'application/json'
        }
    });

    if (!res.ok) {
        // Fallback if assignable fails?
        const txt = await res.text();
        throw new Error(`Jira API Error ${res.status}: ${txt}`);
    }
    return await res.json();
};

export const getMyPermissions = async (options: JiraAuthOptions & { projectKey?: string, permissions?: string[] } = {}) => {
    const baseUrl = getBaseUrl(options);
    const { projectKey, permissions } = options;

    let url = `${baseUrl}/rest/api/3/mypermissions`;
    const params = new URLSearchParams();
    if (projectKey) params.set('projectKey', projectKey);
    if (permissions) params.set('permissions', permissions.join(','));

    if (Array.from(params).length > 0) {
        url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
        headers: {
            'Authorization': getAuthorizationHeader(options.accessToken),
            'Accept': 'application/json'
        }
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Jira API Error ${res.status}: ${txt}`);
    }
    return await res.json();
};
