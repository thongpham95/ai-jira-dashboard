import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { type GeminiModel } from '@/lib/ai';
import { GoogleGenAI } from '@google/genai';
import { type ActiveTask, type ActiveTasksInsights } from '@/app/api/reports/active-tasks/route';

function getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }
    return key;
}

function buildActiveTasksReviewPrompt(
    tasks: ActiveTask[],
    insights: ActiveTasksInsights,
    language: 'vi' | 'en',
    targetUser?: string
): string {
    const lang = language === 'vi' ? 'Vietnamese' : 'English';

    // Build task summary by assignee
    const byAssignee: Record<string, ActiveTask[]> = {};
    tasks.forEach(task => {
        const assigneeId = task.assignee.accountId;
        if (!byAssignee[assigneeId]) {
            byAssignee[assigneeId] = [];
        }
        byAssignee[assigneeId].push(task);
    });

    const assigneeSummaries = Object.entries(byAssignee).map(([_, assigneeTasks]) => {
        const name = assigneeTasks[0].assignee.displayName;
        const taskList = assigneeTasks.map(t => {
            const overdue = t.dueDate && new Date(t.dueDate) < new Date() ? ' ⚠️ OVERDUE' : '';
            const highPriority = ['Highest', 'High', 'Critical', 'Blocker'].includes(t.priority.name) ? ' 🔴' : '';
            const timeInStatus = t.timeInStatus ? ` (${t.timeInStatus}h in status)` : '';
            return `    - [${t.issueKey}] ${t.summary} | Status: ${t.status.name} | Priority: ${t.priority.name}${timeInStatus}${overdue}${highPriority}`;
        }).join('\n');
        return `**${name}** (${assigneeTasks.length} active tasks):\n${taskList}`;
    }).join('\n\n');

    // Build priority distribution
    const priorityDist = Object.entries(insights.byPriority)
        .map(([priority, count]) => `${priority}: ${count}`)
        .join(', ');

    // Build status distribution
    const statusDist = Object.entries(insights.byStatus)
        .map(([status, count]) => `${status}: ${count}`)
        .join(', ');

    // Build project distribution
    const projectDist = Object.entries(insights.byProject)
        .map(([project, count]) => `${project}: ${count}`)
        .join(', ');

    const targetUserContext = targetUser
        ? `Focus your analysis specifically on the user: **${targetUser}**. However, provide context about team workload for comparison.`
        : 'Analyze the entire team workload.';

    return `You are a professional Project Manager AI assistant. Analyze the following real-time active tasks data and produce an instant workflow review.

**RESPOND IN ${lang}.**

${targetUserContext}

## Current Active Tasks Overview:
- **Total Active Tasks**: ${insights.totalTasks}
- **Overdue Tasks**: ${insights.overdueTasks}
- **High Priority Tasks**: ${insights.highPriorityTasks}
- **Average Time in Status**: ${insights.avgTimeInStatus} hours
- **Priority Distribution**: ${priorityDist}
- **Status Distribution**: ${statusDist}
- **Project Distribution**: ${projectDist}

## Active Tasks by Assignee:
${assigneeSummaries || 'No active tasks found.'}

---

**Your report MUST include these sections (use markdown headers):**

### 🚀 Tình trạng Công việc Hiện tại / Current Workflow Status
A 2-3 sentence high-level summary. Is the team productive? Any bottlenecks? Are tasks moving or stuck?

### 👥 Phân tích Khối lượng Công việc / Workload Analysis
- Who has the most tasks? Are they overloaded?
- Who has fewer tasks? Can they help others?
- Is workload balanced across the team?

### ⚠️ Cảnh báo & Rủi ro / Warnings & Risks
- Overdue tasks that need immediate attention
- High priority items that should be escalated
- Tasks stuck too long in the same status (> 24h is concerning, > 48h is critical)

### 💡 Đề xuất Hành động / Recommended Actions
Give 3-5 specific, actionable recommendations for the PM/Team Lead:
- Which tasks should be prioritized?
- Should any tasks be reassigned?
- Any blockers that need to be removed?

**Rules:**
- Be concise and actionable
- Use the data provided - do NOT invent information
- Highlight both positives and concerns
- Focus on immediate, actionable insights`;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;
        // @ts-ignore
        const cloudId = session?.cloudId;

        if (!accessToken || !cloudId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { projectKey, userId, model, language } = body;

        // Build URL to fetch active tasks with insights
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        let fetchUrl = `${baseUrl}/api/reports/active-tasks?includeInsights=true`;
        if (projectKey && projectKey !== 'all') {
            fetchUrl += `&projectKey=${projectKey}`;
        }
        if (userId && userId !== 'all') {
            fetchUrl += `&userId=${userId}`;
        }

        // Fetch active tasks data (internal API call)
        const activeTasksResponse = await fetch(fetchUrl, {
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
        });

        if (!activeTasksResponse.ok) {
            throw new Error('Failed to fetch active tasks data');
        }

        const activeTasksData = await activeTasksResponse.json();
        const tasks: ActiveTask[] = activeTasksData.tasks || [];
        const insights: ActiveTasksInsights = activeTasksData.insights;

        if (tasks.length === 0) {
            return NextResponse.json({
                review: language === 'vi'
                    ? '### ✅ Không có công việc đang thực hiện\n\nHiện tại không có task nào đang ở trạng thái "In Progress". Đội có thể đang chờ việc hoặc tất cả công việc đã hoàn thành.'
                    : '### ✅ No Active Tasks\n\nThere are currently no tasks in "In Progress" status. The team might be waiting for work or all tasks are completed.',
                metadata: {
                    generatedAt: new Date().toISOString(),
                    model: model || 'gemini-2.5-flash',
                    totalTasks: 0,
                    projectKey: projectKey || 'all',
                    userId: userId || 'all',
                },
            });
        }

        // Find target user name if filtering by userId
        let targetUserName: string | undefined;
        if (userId && userId !== 'all' && tasks.length > 0) {
            targetUserName = tasks[0].assignee.displayName;
        }

        const prompt = buildActiveTasksReviewPrompt(tasks, insights, language || 'vi', targetUserName);

        // Generate AI review
        const client = new GoogleGenAI({ apiKey: getApiKey() });
        const selectedModel: GeminiModel = model || 'gemini-2.5-flash';
        const isPro = selectedModel.includes('pro');

        const response = await client.models.generateContent({
            model: selectedModel,
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
            throw new Error('AI returned an empty response. Please try again.');
        }

        return NextResponse.json({
            review: text,
            metadata: {
                generatedAt: new Date().toISOString(),
                model: selectedModel,
                totalTasks: insights.totalTasks,
                overdueTasks: insights.overdueTasks,
                highPriorityTasks: insights.highPriorityTasks,
                avgTimeInStatus: insights.avgTimeInStatus,
                projectKey: projectKey || 'all',
                userId: userId || 'all',
            },
        });
    } catch (error: any) {
        console.error('AI Active Tasks Review Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate active tasks review' },
            { status: 500 }
        );
    }
}
