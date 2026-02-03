/**
 * User Validation Script
 *
 * Validates that all users from Jira show correct hours/tasks in their detail view.
 * Run against a live dev server: npx tsx scripts/validate-users.ts
 *
 * Requires the dev server to be running at http://localhost:3000
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface User {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    active: boolean;
}

interface Issue {
    key: string;
    fields: {
        summary: string;
        timespent?: number | null;
    };
}

async function main() {
    console.log(`Validating users against ${BASE_URL}...\n`);

    // 1. Fetch all users
    const usersRes = await fetch(`${BASE_URL}/api/users`);
    if (!usersRes.ok) {
        console.error('Failed to fetch users:', usersRes.status, await usersRes.text());
        process.exit(1);
    }

    const users: User[] = await usersRes.json();
    const activeUsers = users.filter(u => u.active && u.accountId);
    console.log(`Found ${users.length} total users, ${activeUsers.length} active with accountId.\n`);

    const results: { name: string; accountId: string; taskCount: number; totalHours: string; flag: string }[] = [];

    // 2. For each user, fetch their tasks
    for (const user of activeUsers) {
        try {
            const jql = `assignee = "${user.accountId}" ORDER BY updated DESC`;
            const issuesRes = await fetch(`${BASE_URL}/api/issues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jql,
                    fetchAll: true,
                    fields: ['summary', 'timespent']
                })
            });

            if (!issuesRes.ok) {
                const errText = await issuesRes.text();
                results.push({
                    name: user.displayName,
                    accountId: user.accountId,
                    taskCount: -1,
                    totalHours: 'ERROR',
                    flag: `API error: ${errText.substring(0, 100)}`
                });
                continue;
            }

            const data = await issuesRes.json();
            const issues: Issue[] = data.issues || [];

            const totalSeconds = issues.reduce(
                (sum, t) => sum + (t.fields?.timespent || 0), 0
            );
            const totalHours = (totalSeconds / 3600).toFixed(1);

            let flag = '';
            if (issues.length === 0) {
                flag = 'NO TASKS - check accountId encoding';
            }

            results.push({
                name: user.displayName,
                accountId: user.accountId,
                taskCount: issues.length,
                totalHours: `${totalHours}h`,
                flag
            });

            // Rate limit - small delay between requests
            await new Promise(r => setTimeout(r, 200));
        } catch (err: any) {
            results.push({
                name: user.displayName,
                accountId: user.accountId,
                taskCount: -1,
                totalHours: 'ERROR',
                flag: err.message
            });
        }
    }

    // 3. Print results
    console.log('='.repeat(100));
    console.log(
        'Name'.padEnd(30),
        'Tasks'.padEnd(8),
        'Hours'.padEnd(10),
        'Flag'
    );
    console.log('-'.repeat(100));

    for (const r of results) {
        console.log(
            r.name.padEnd(30),
            String(r.taskCount).padEnd(8),
            r.totalHours.padEnd(10),
            r.flag
        );
    }

    console.log('='.repeat(100));

    const flagged = results.filter(r => r.flag);
    if (flagged.length > 0) {
        console.log(`\n⚠ ${flagged.length} user(s) flagged for review.`);
    } else {
        console.log(`\n✓ All ${results.length} users validated successfully.`);
    }
}

main().catch(console.error);
