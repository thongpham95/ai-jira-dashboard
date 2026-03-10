import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchPerformanceData, type MemberPerformanceMetrics } from '@/lib/jira-performance';
import { type GeminiModel } from '@/lib/ai';
import { GoogleGenAI } from '@google/genai';

function getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }
    return key;
}

function buildPerformanceReviewPrompt(
    members: MemberPerformanceMetrics[],
    role: string,
    dateRange: { start: string; end: string },
    language: 'vi' | 'en'
): string {
    const lang = language === 'vi' ? 'Vietnamese' : 'English';
    const roleLabel = role === 'developer' ? 'Developer' : role === 'tech_lead' ? 'Tech Lead' : 'QC';

    const memberSummaries = members.map(m => {
        const anomalyText = m.anomalies.length > 0
            ? m.anomalies.map(a => `  ⚠️ ${a.message}`).join('\n')
            : '  ✅ No anomalies';

        return `- **${m.userName}** (${m.totalIssuesCompleted} issues completed, ${m.totalStoryPoints} SP)
  - Avg Cycle Time: ${m.avgCycleTimeHours}h | Median: ${m.medianCycleTimeHours}h | Min: ${m.minCycleTimeHours}h | Max: ${m.maxCycleTimeHours}h
  - First Time Pass Rate: ${m.firstTimePassRate}% (${m.reopenCount} reopens)
${anomalyText}`;
    }).join('\n\n');

    return `You are a professional Engineering Manager AI assistant. Analyze the following team performance data and produce a Performance Review summary for **${roleLabel}** team members.

**RESPOND IN ${lang}.**

## Date Range: ${dateRange.start} → ${dateRange.end}
## Role: ${roleLabel}

### Team Members Performance Data:
${memberSummaries || 'No data available.'}

---

**Your report MUST include these sections (use markdown headers):**

### 📊 Tổng quan Hiệu suất / Performance Overview
A 2-3 sentence high-level summary of team performance. Who are the top performers? Any major concerns?

### 👤 Đánh giá Từng Thành viên / Individual Assessments
For each member, provide:
- Strengths (based on metrics)
- Areas for improvement
- Specific recommendations

### ⚠️ Điểm Bất thường / Anomalies & Red Flags
Highlight any concerning patterns: extremely long cycle times, high reopen rates, lack of activity.

### 💡 Đề xuất cho Quản lý / Management Recommendations
Give 3-5 specific, actionable recommendations for the manager based on the data.

**Rules:**
- Be constructive, not punitive. Focus on improvement.
- Use data from above. Do NOT invent metrics.
- Be concise and direct.
- Highlight both strengths and areas for improvement.`;
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
        const { projectKey, startDate, endDate, role, model, language } = body;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
        }

        // Fetch performance data
        const perfData = await fetchPerformanceData({
            accessToken,
            cloudId,
            projectKey: projectKey || 'all',
            startDate,
            endDate,
        });

        // Select role data
        let members: MemberPerformanceMetrics[] = [];
        const selectedRole = role || 'developer';
        if (selectedRole === 'developer') members = perfData.developers;
        else if (selectedRole === 'tech_lead') members = perfData.techLeads;
        else if (selectedRole === 'qc') members = perfData.qcMembers;
        else members = [...perfData.developers, ...perfData.techLeads, ...perfData.qcMembers];

        const prompt = buildPerformanceReviewPrompt(members, selectedRole, perfData.dateRange, language || 'vi');

        // Generate AI review
        const client = new GoogleGenAI({ apiKey: getApiKey() });
        const selectedModel: GeminiModel = model || 'gemini-2.5-flash';
        const isPro = selectedModel.includes('pro');

        const response = await client.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 8192,
                ...(isPro ? {
                    thinkingConfig: {
                        thinkingBudget: 4096,
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
                role: selectedRole,
                dateRange: perfData.dateRange,
                membersAnalyzed: members.length,
                totalIssues: perfData.totalIssuesAnalyzed,
            },
        });
    } catch (error: any) {
        console.error('AI Performance Review Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate performance review' },
            { status: 500 }
        );
    }
}
