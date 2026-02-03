import JiraClient from 'jira-client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    // Debug: list keys
    const jiraKeys = Object.keys(process.env).filter(k => k.startsWith('JIRA_'));
    console.log("Found JIRA_ keys in env:", jiraKeys);

    const host = process.env.JIRA_HOST;
    const username = process.env.JIRA_EMAIL;
    const password = process.env.JIRA_API_TOKEN;

    console.log("Testing connection with:");
    console.log(`Host: '${host}'`);
    console.log(`Email: '${username}'`);
    console.log(`Token: '${password ? '******' + password.slice(-4) : 'MISSING'}'`);

    if (!host || !username || !password) {
        console.error("❌ Missing credentials.");
        return;
    }

    try {
        const url = new URL(host);
        const jira = new JiraClient({
            protocol: url.protocol.replace(':', ''),
            host: url.hostname,
            username: username,
            password: password,
            apiVersion: '3',
            strictSSL: true
        });

        console.log("Attempting to fetch current user...");
        const user = await jira.getCurrentUser();
        console.log("✅ Connection Successful!");
        console.log(`Connected as: ${user.displayName} (${user.emailAddress})`);

        console.log("Attempting to list projects...");
        const projects = await jira.listProjects();
        console.log(`✅ Found ${projects.length} projects.`);
        if (projects.length > 0) {
            console.log(`First project: ${projects[0].key} - ${projects[0].name}`);
        } else {
            console.log("⚠️ No projects found. Verify permissions.");
        }

    } catch (error: any) {
        console.error("❌ Connection Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error("Body:", JSON.stringify(error.response.body, null, 2));
        } else {
            console.error(error.message);
        }

        if (error.message.includes("Invalid URL")) {
            console.log("\n💡 Hint: JIRA_HOST must include the protocol, e.g., 'https://your-domain.atlassian.net'");
        }
    }
}

testConnection();
