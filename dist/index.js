#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
// ── Config from env ─────────────────────────────────────────────────────────
const TOKEN = process.env.CONTEXTFLOW_TOKEN;
const API_URL = process.env.CONTEXTFLOW_API_URL ?? 'http://localhost:3001';
if (!TOKEN) {
    console.error('[contextflow-mcp] Error: CONTEXTFLOW_TOKEN env var is required.');
    process.exit(1);
}
const api = axios.create({ baseURL: API_URL, timeout: 30_000 });
// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
    name: 'contextflow',
    version: '1.0.0',
});
// ── Tool: get_context_info ───────────────────────────────────────────────────
server.tool('get_context_info', 'Get metadata about the current Contextflow snapshot: repository name, branch, number of indexed files and vectorized chunks, and its processing status.', {}, async () => {
    const { data } = await api.get(`/context/${TOKEN}`);
    return {
        content: [
            {
                type: 'text',
                text: [
                    `📦 Snapshot: ${data.name}`,
                    `Branch: ${data.branch}`,
                    `Status: ${data.status}`,
                    `Files indexed: ${data.totalFiles}`,
                    `Chunks vectorized: ${data.totalChunks}`,
                    data.description ? `Description: ${data.description}` : '',
                    `Created: ${data.createdAt}`,
                ]
                    .filter(Boolean)
                    .join('\n'),
            },
        ],
    };
});
// ── Tool: search_context ─────────────────────────────────────────────────────
server.tool('search_context', 'Semantically search the codebase for relevant code fragments. Returns the most similar code chunks with file paths and line numbers. Use this when you need to find WHERE something is implemented.', {
    query: z.string().describe('Natural language description of what you are looking for in the code'),
    top_k: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(6)
        .describe('Number of code chunks to return (default 6, max 20)'),
    threshold: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .default(0.45)
        .describe('Minimum similarity score 0–1 (default 0.45)'),
}, async ({ query, top_k, threshold }) => {
    const { data } = await api.post(`/context/${TOKEN}/query`, {
        query,
        topK: top_k,
        threshold,
    });
    if (!data.results || data.results.length === 0) {
        return {
            content: [{ type: 'text', text: 'No relevant code fragments found for this query.' }],
        };
    }
    const chunks = data.results
        .map((c, i) => `### [${i + 1}] ${c.filePath} (L${c.startLine}–${c.endLine}) · ${Math.round(c.similarity * 100)}% match${c.language ? ` · ${c.language}` : ''}\n\`\`\`${c.language ?? ''}\n${c.content}\n\`\`\``)
        .join('\n\n');
    return {
        content: [
            {
                type: 'text',
                text: `Found ${data.results.length} relevant fragments (${data.processingTimeMs}ms):\n\n${chunks}`,
            },
        ],
    };
});
// ── Tool: ask_context ────────────────────────────────────────────────────────
server.tool('ask_context', 'Ask a natural language question about the codebase and get relevant code fragments as context. Use this when you need to UNDERSTAND how something works, not just find it.', {
    question: z
        .string()
        .describe('Your question about the codebase (e.g. "How does authentication work?" or "Where are permissions validated?")'),
    top_k: z
        .number()
        .int()
        .min(3)
        .max(12)
        .optional()
        .default(8)
        .describe('Number of code chunks to retrieve as context (default 8)'),
}, async ({ question, top_k }) => {
    const { data } = await api.post(`/context/${TOKEN}/query`, {
        query: question,
        topK: top_k,
        threshold: 0.3,
    });
    if (!data.results || data.results.length === 0) {
        return {
            content: [{ type: 'text', text: 'No relevant code fragments found for this question.' }],
        };
    }
    const chunks = data.results
        .map((c, i) => `### [${i + 1}] ${c.filePath} (L${c.startLine}–${c.endLine}) · ${Math.round(c.similarity * 100)}% match${c.language ? ` · ${c.language}` : ''}\n\`\`\`${c.language ?? ''}\n${c.content}\n\`\`\``)
        .join('\n\n');
    return {
        content: [
            {
                type: 'text',
                text: `Found ${data.results.length} relevant fragments for "${question}" (${data.processingTimeMs}ms):\n\n${chunks}`,
            },
        ],
    };
});
// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
