// AI Service Layer - Google Gemini Integration
// Default: gemini-2.5-flash (fast, free tier friendly)
// Optional: gemini-2.5-pro (deeper analysis)

import { GoogleGenAI } from "@google/genai";

export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";

export const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fastest, free tier friendly" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Deep analysis, higher cost" },
];

export const DEFAULT_MODEL: GeminiModel = "gemini-2.5-flash";

// Get API key from environment variable
function getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables or .env.local file.");
    }
    return key;
}

// Create Gemini client
function getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: getApiKey() });
}

export interface AISummaryRequest {
    projectData: {
        projectName: string;
        epics: EpicData[];
        criticalBugs: BugData[];
        teamWorkload: WorkloadData[];
        overdueTasks: TaskData[];
        sprintInfo?: SprintData;
    };
    model?: GeminiModel;
    language?: "vi" | "en";
}

export interface EpicData {
    name: string;
    key: string;
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    blockerCount: number;
}

export interface BugData {
    key: string;
    summary: string;
    priority: string;
    assignee: string | null;
    created: string;
    status: string;
}

export interface WorkloadData {
    memberName: string;
    assignedTasks: number;
    completedTasks: number;
    hoursLogged: number;
}

export interface TaskData {
    key: string;
    summary: string;
    assignee: string | null;
    dueDate: string;
    status: string;
    daysOverdue: number;
}

export interface SprintData {
    name: string;
    startDate: string;
    endDate: string;
    totalIssues: number;
    completedIssues: number;
}

function buildPrompt(data: AISummaryRequest["projectData"], language: "vi" | "en"): string {
    const lang = language === "vi" ? "Vietnamese" : "English";

    return `You are a professional Project Management AI assistant. Analyze the following Jira project data and produce an Executive Summary report.

**RESPOND IN ${lang}.**

## Project: ${data.projectName}

${data.sprintInfo ? `### Current Sprint
- Name: ${data.sprintInfo.name}
- Period: ${data.sprintInfo.startDate} → ${data.sprintInfo.endDate}
- Progress: ${data.sprintInfo.completedIssues}/${data.sprintInfo.totalIssues} completed
` : ""}

### Epic Progress (Phases)
${data.epics.length > 0 ? data.epics.map(e =>
        `- **${e.name}** (${e.key}): ${e.doneTasks}/${e.totalTasks} done (${e.totalTasks > 0 ? Math.round((e.doneTasks / e.totalTasks) * 100) : 0}%), In Progress: ${e.inProgressTasks}, To Do: ${e.todoTasks}, Blockers: ${e.blockerCount}`
    ).join("\n") : "No epics found."}

### Critical/High Priority Bugs (Unresolved)
${data.criticalBugs.length > 0 ? data.criticalBugs.map(b =>
        `- [${b.key}] ${b.summary} | Priority: ${b.priority} | Assignee: ${b.assignee || "Unassigned"} | Status: ${b.status} | Created: ${b.created}`
    ).join("\n") : "No critical bugs! 🎉"}

### Team Workload
${data.teamWorkload.length > 0 ? data.teamWorkload.map(w =>
        `- ${w.memberName}: ${w.assignedTasks} assigned, ${w.completedTasks} completed, ${w.hoursLogged}h logged`
    ).join("\n") : "No workload data."}

### Overdue Tasks
${data.overdueTasks.length > 0 ? data.overdueTasks.map(t =>
        `- [${t.key}] ${t.summary} | Assignee: ${t.assignee || "Unassigned"} | Due: ${t.dueDate} | ${t.daysOverdue} days overdue`
    ).join("\n") : "No overdue tasks! 🎉"}

---

**Your report MUST include these sections (use markdown headers):**

### 📊 Tổng quan / Overview
A 2-3 sentence high-level summary of project health.

### 📈 Tiến độ theo Epic / Epic Progress
For each Epic, describe completion % and any blockers. Highlight Epics that are behind schedule.

### 🚨 Rủi ro & Vấn đề / Risks & Issues  
List the top 3-5 risks: unassigned critical bugs, overloaded members, overdue tasks, blocked items.

### 💡 Đề xuất hành động / Recommended Actions
Give 3-5 specific, actionable recommendations for the PM/Team Lead.

**Rules:**
- Be concise and direct. No fluff.
- Use data from above. Do NOT invent issues/tasks that don't exist.
- Prioritize the most impactful items.
- Use emoji sparingly for visual clarity.`;
}

export async function generateExecutiveSummary(request: AISummaryRequest): Promise<string> {
    const client = getClient();
    const model = request.model || DEFAULT_MODEL;
    const language = request.language || "vi";
    const isPro = model.includes("pro");

    const prompt = buildPrompt(request.projectData, language);

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 8192,
                // Gemini 2.5 Pro is a "thinking model" — it needs a thinking budget
                // to reason internally before producing output. Without this, the
                // thinking tokens consume the entire output budget → empty response.
                ...(isPro ? {
                    thinkingConfig: {
                        thinkingBudget: 4096,
                    },
                } : {}),
            },
        });

        const text = response.text;
        if (!text || text.trim().length === 0) {
            throw new Error(
                `Model ${model} returned an empty response. ` +
                (isPro
                    ? "Gemini Pro may be overloaded. Try again or switch to Gemini Flash."
                    : "Please try again.")
            );
        }

        return text;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error.message?.includes("API_KEY")) {
            throw new Error("Invalid Gemini API Key. Please check your settings.");
        }
        if (error.message?.includes("quota") || error.message?.includes("429")) {
            throw new Error("Gemini API quota exceeded. Please try again later or switch to a different model.");
        }
        throw new Error(`AI generation failed: ${error.message}`);
    }
}


// ================================
// AI Standup Generator
// ================================

export interface StandupRequest {
    memberName: string;
    worklogs: StandupWorklog[];
    statusChanges: StandupStatusChange[];
    model?: GeminiModel;
    language?: "vi" | "en";
}

export interface StandupWorklog {
    issueKey: string;
    issueSummary: string;
    issueType: string;
    timeSpent: string;
    date: string;
}

export interface StandupStatusChange {
    issueKey: string;
    issueSummary: string;
    issueType: string;
    fromStatus: string;
    toStatus: string;
    date: string;
}

function buildStandupPrompt(data: StandupRequest, language: "vi" | "en"): string {
    const lang = language === "vi" ? "Vietnamese" : "English";
    const today = new Date().toISOString().split("T")[0];

    return `You are a helpful assistant generating a Daily Standup Report for a software development team member.

**RESPOND IN ${lang}.**

## Member: ${data.memberName}
## Date: ${today}

### Work Logs (last 24 hours)
${data.worklogs.length > 0 ? data.worklogs.map(w =>
        `- [${w.issueKey}] ${w.issueSummary} (${w.issueType}) — ${w.timeSpent} on ${w.date}`
    ).join("\n") : "No worklogs recorded."}

### Status Changes (last 24 hours)
${data.statusChanges.length > 0 ? data.statusChanges.map(s =>
        `- [${s.issueKey}] ${s.issueSummary} (${s.issueType}): ${s.fromStatus} → ${s.toStatus} on ${s.date}`
    ).join("\n") : "No status changes."}

---

**Generate a standup report with EXACTLY these 3 sections:**

### ✅ Hôm qua đã làm / What I Did Yesterday
Summarize key activities based on worklogs. Group by task when possible.

### 📋 Hôm nay sẽ làm / What I Will Do Today
Predict what the member will likely work on today, based on in-progress items and recent patterns.

### 🚧 Blockers / Vấn đề
If any tickets are stuck (no progress) or have blockers, mention them. If none, say "No blockers."

**Rules:**
- Be concise: max 3-5 bullet points per section.
- Reference ticket keys [KEY-123] for traceability.
- Do NOT invent tickets that don't exist in the data.
- Keep tone professional but brief.`;
}

export async function generateStandupReport(request: StandupRequest): Promise<string> {
    const client = getClient();
    const model = request.model || DEFAULT_MODEL;
    const language = request.language || "vi";
    const isPro = model.includes("pro");

    const prompt = buildStandupPrompt(request, language);

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 4096,
                ...(isPro ? {
                    thinkingConfig: {
                        thinkingBudget: 2048,
                    },
                } : {}),
            },
        });

        const text = response.text;
        if (!text || text.trim().length === 0) {
            throw new Error(`Model ${model} returned an empty response. Please try again.`);
        }

        return text;
    } catch (error: any) {
        console.error("Gemini Standup Error:", error);
        if (error.message?.includes("API_KEY")) {
            throw new Error("Invalid Gemini API Key. Please check your settings.");
        }
        if (error.message?.includes("quota") || error.message?.includes("429")) {
            throw new Error("Gemini API quota exceeded. Please try again later.");
        }
        throw new Error(`AI generation failed: ${error.message}`);
    }
}


// ================================
// AI JQL Search (Natural Language → JQL)
// ================================

export interface JQLConversionRequest {
    naturalLanguage: string;
    projectKeys?: string[];
    model?: GeminiModel;
    language?: "vi" | "en";
}

function buildJQLPrompt(query: string, projectKeys: string[], language: "vi" | "en"): string {
    return `You are a Jira JQL expert. Convert the following natural language query into a valid JQL (Jira Query Language) string.

**User Query (in ${language === "vi" ? "Vietnamese" : "English"}):** "${query}"

**Available Project Keys:** ${projectKeys.length > 0 ? projectKeys.join(", ") : "Unknown (omit project filter if not specified)"}

**JQL Reference:**
- Fields: project, issuetype, status, priority, assignee, reporter, summary, created, updated, duedate, resolution, labels, sprint, fixVersion, component
- Issue types: Bug, Task, Story, Epic, Sub-task
- Priorities: Highest, High, Medium, Low, Lowest
- Status categories: "To Do", "In Progress", "Done", "Code Review", "Closed"
- Operators: =, !=, IN, NOT IN, ~, !~, >, <, >=, <=, IS, IS NOT, WAS, CHANGED
- Functions: currentUser(), startOfDay(), endOfDay(), startOfWeek(), endOfWeek(), startOfMonth(), endOfMonth(), now()
- Relative dates: "-1d", "-7d", "-30d", "-1w"
- Keywords: AND, OR, NOT, ORDER BY, ASC, DESC

**Rules:**
1. Return ONLY the JQL string, nothing else. No markdown, no explanation.
2. Use appropriate date functions for time-based queries.
3. If the user mentions a specific project, use the correct project key from the available list.
4. Default ORDER BY: created DESC (unless user specifies otherwise).
5. Use ~ for text search (contains), = for exact match.
6. Common patterns:
   - "bugs this week" → issuetype = Bug AND created >= startOfWeek()
   - "my tasks" → assignee = currentUser()
   - "critical bugs" → issuetype = Bug AND priority in (Highest, High, Critical)
   - "overdue" → duedate < now() AND resolution = Unresolved`;
}

export async function convertNaturalLanguageToJQL(request: JQLConversionRequest): Promise<string> {
    const client = getClient();
    const model = request.model || DEFAULT_MODEL;
    const language = request.language || "vi";

    const prompt = buildJQLPrompt(request.naturalLanguage, request.projectKeys || [], language);

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.1, // Very low for precise JQL output
                maxOutputTokens: 512,
            },
        });

        const text = response.text?.trim();
        if (!text) {
            throw new Error("AI could not generate JQL. Please try rephrasing your query.");
        }

        // Clean up: remove markdown code blocks if present
        const cleaned = text
            .replace(/^```(?:jql)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        return cleaned;
    } catch (error: any) {
        console.error("Gemini JQL Error:", error);
        if (error.message?.includes("API_KEY")) {
            throw new Error("GEMINI_API_KEY is not configured.");
        }
        throw new Error(`AI JQL conversion failed: ${error.message}`);
    }
}


// ================================
// Test Gemini Connection
// ================================

export async function testGeminiConnection(apiKey: string, model?: GeminiModel): Promise<boolean> {
    try {
        const client = new GoogleGenAI({ apiKey });
        const selectedModel = model || DEFAULT_MODEL;

        const response = await client.models.generateContent({
            model: selectedModel,
            contents: "Say 'OK' if you can read this.",
            config: {
                temperature: 0,
                maxOutputTokens: 16,
            },
        });

        const text = response.text?.trim();
        return !!text && text.length > 0;
    } catch (error: any) {
        console.error("Gemini connection test failed:", error);
        throw new Error(`Connection failed: ${error.message}`);
    }
}

