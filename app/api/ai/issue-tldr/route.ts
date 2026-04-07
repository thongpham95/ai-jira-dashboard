import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateIssueTLDR, GeminiModel } from '@/lib/ai';

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

        const { issueKey, model, language } = await request.json();

        if (!issueKey) {
            return NextResponse.json({ error: 'Issue key is required' }, { status: 400 });
        }

        // Fetch issue details from Jira
        const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
        const issueRes = await fetch(
            `${baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,description,issuetype,status,priority,assignee,reporter,created,updated,labels,components,comment`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!issueRes.ok) {
            const errorText = await issueRes.text();
            return NextResponse.json(
                { error: `Failed to fetch issue: ${errorText}` },
                { status: issueRes.status }
            );
        }

        const issueData = await issueRes.json();
        const fields = issueData.fields;

        // Parse description (handle Atlassian Document Format)
        let descriptionText = '';
        if (fields.description) {
            if (typeof fields.description === 'string') {
                descriptionText = fields.description;
            } else if (fields.description.content) {
                // ADF format - extract text
                descriptionText = extractTextFromADF(fields.description);
            }
        }

        // Parse comments
        const comments = (fields.comment?.comments || []).map((c: any) => ({
            author: c.author?.displayName || 'Unknown',
            body: extractTextFromADF(c.body),
            created: c.created?.split('T')[0] || '',
        }));

        // Build request for AI
        const tldrRequest = {
            issue: {
                key: issueKey,
                summary: fields.summary || '',
                description: descriptionText,
                issueType: fields.issuetype?.name || 'Unknown',
                status: fields.status?.name || 'Unknown',
                priority: fields.priority?.name || 'Medium',
                assignee: fields.assignee?.displayName || null,
                reporter: fields.reporter?.displayName || null,
                created: fields.created?.split('T')[0] || '',
                updated: fields.updated?.split('T')[0] || '',
                labels: fields.labels || [],
                components: (fields.components || []).map((c: any) => c.name),
            },
            comments,
            model: model as GeminiModel,
            language: language || 'vi',
        };

        // Generate TL;DR
        const tldr = await generateIssueTLDR(tldrRequest);

        return NextResponse.json({
            issueKey,
            tldr,
            metadata: {
                model: model || 'gemini-2.5-flash',
                language: language || 'vi',
                commentsCount: comments.length,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('Issue TL;DR API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate issue summary' },
            { status: 500 }
        );
    }
}

// Helper to extract plain text from Atlassian Document Format
function extractTextFromADF(adf: any): string {
    if (!adf) return '';
    if (typeof adf === 'string') return adf;

    const extractFromNode = (node: any): string => {
        if (!node) return '';

        // Text node
        if (node.type === 'text') {
            return node.text || '';
        }

        // Container nodes with content
        if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractFromNode).join('');
        }

        // Paragraph, heading, etc.
        if (node.type === 'paragraph' || node.type === 'heading') {
            const text = node.content ? node.content.map(extractFromNode).join('') : '';
            return text + '\n';
        }

        // List items
        if (node.type === 'listItem') {
            const text = node.content ? node.content.map(extractFromNode).join('') : '';
            return '• ' + text;
        }

        // Code blocks
        if (node.type === 'codeBlock') {
            const text = node.content ? node.content.map(extractFromNode).join('') : '';
            return '```\n' + text + '\n```\n';
        }

        return '';
    };

    if (adf.content && Array.isArray(adf.content)) {
        return adf.content.map(extractFromNode).join('').trim();
    }

    return '';
}
