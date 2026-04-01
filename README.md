# contextflow-mcp

> **MCP server** that connects Claude to [Contextflow](https://contextflow.app) — semantic code search and AI-powered Q&A over vectorized repositories, directly inside Claude.

[![npm version](https://img.shields.io/npm/v/contextflow-mcp.svg)](https://www.npmjs.com/package/contextflow-mcp)
[![license](https://img.shields.io/npm/l/contextflow-mcp.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## ✨ What it does

`contextflow-mcp` gives Claude three native tools to interact with a **Contextflow snapshot** — a vectorized index of your entire codebase:

| Tool | What it does |
|------|-------------|
| 🔍 `search_context` | Semantic search over your codebase — finds relevant code by meaning, not keywords |
| 🤖 `ask_context` | Ask any question about your code, get an AI answer grounded in real source files |
| 📊 `get_context_info` | Inspect snapshot metadata: repo name, branch, files indexed, vectorized chunks |

Once configured, Claude can answer questions like:

- *"How does the authentication flow work?"*
- *"Find all places where we handle HTTP errors"*
- *"Is there any retry logic for failed API calls?"*

…and cite the exact file and line numbers from your codebase.

---

## 🚀 Quick Start

### Option A — npx (recommended, no install needed)

**macOS / Linux:**
```json
{
  "mcpServers": {
    "contextflow": {
      "command": "npx",
      "args": ["-y", "contextflow-mcp"],
      "env": {
        "CONTEXTFLOW_TOKEN": "your_snapshot_token",
        "CONTEXTFLOW_API_URL": "https://backend2-contextflow.frogland.tech"
      }
    }
  }
}
```

**Windows** (requires `cmd /c` wrapper):
```json
{
  "mcpServers": {
    "contextflow": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "contextflow-mcp"],
      "env": {
        "CONTEXTFLOW_TOKEN": "your_snapshot_token",
        "CONTEXTFLOW_API_URL": "https://backend2-contextflow.frogland.tech"
      }
    }
  }
}
```

### Option B — Global install

```bash
npm install -g contextflow-mcp
```

```json
{
  "mcpServers": {
    "contextflow": {
      "command": "contextflow-mcp",
      "args": [],
      "env": {
        "CONTEXTFLOW_TOKEN": "your_snapshot_token",
        "CONTEXTFLOW_API_URL": "https://backend2-contextflow.frogland.tech"
      }
    }
  }
}
```

---

## ⚙️ Configuration

### Where to add the config

| Claude client | Config file location |
|--------------|---------------------|
| **Claude Desktop (Mac)** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop (Windows)** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Claude Code CLI** | Run `claude mcp add` (see below) |

### Claude Code CLI

```bash
claude mcp add contextflow npx -- -y contextflow-mcp \
  -e CONTEXTFLOW_TOKEN=your_token \
  -e CONTEXTFLOW_API_URL=https://backend2-contextflow.frogland.tech
```

---

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONTEXTFLOW_TOKEN` | ✅ Yes | — | Public token of your Contextflow snapshot |
| `CONTEXTFLOW_API_URL` | ❌ No | `https://backend2-contextflow.frogland.tech` | Base URL of the Contextflow API server |

> The server will exit immediately with a clear error message if `CONTEXTFLOW_TOKEN` is not set.

---

## 🛠️ Tools Reference

### `get_context_info`

Returns metadata about the connected Contextflow snapshot.

```
No parameters required.
```

**Example output:**
```
Snapshot: my-backend
Branch: main
Status: ready
Files indexed: 142
Vectorized chunks: 1,847
Created: 2026-03-15T10:32:00Z
```

---

### `search_context`

Performs semantic vector search over the indexed codebase.

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `query` | string | ✅ Yes | — | — | Natural language description of what to find |
| `top_k` | number | ❌ No | `6` | 1–20 | Number of results to return |
| `threshold` | number | ❌ No | `0.45` | 0–1 | Minimum similarity score |

**Example output:**
```
Found 3 relevant fragments (87ms):

### [1] src/auth/middleware.ts (L12–45) · 92% match · typescript
export async function authMiddleware(req, res, next) {
  const token = req.cookies.session;
  ...
}

### [2] src/auth/jwt.ts (L5–28) · 78% match · typescript
...
```

---

### `ask_context`

AI-powered Q&A grounded in your actual source code.

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `question` | string | ✅ Yes | — | — | Natural language question about the codebase |
| `top_k` | number | ❌ No | `8` | 3–12 | Number of code chunks used as context |

**Example output:**
```
The authentication system uses JWT tokens stored in HTTP-only cookies...

**Sources used:**
  1. `src/auth/middleware.ts` L12–45 (92% match)
  2. `src/config/jwt.ts` L5–20 (76% match)
  3. `src/routes/login.ts` L88–112 (71% match)

_Generated in 234ms_
```

---

## 🏗️ How it works

```
Claude ──(MCP stdio)──▶ contextflow-mcp ──(HTTP REST)──▶ Contextflow API
                             │                                    │
                        Validates params               Vector search + AI
                        Formats results                Returns chunks + answers
```

The MCP server is a lightweight adapter — it receives tool calls from Claude, proxies them to the Contextflow API using your token, and formats the results back to Claude with file paths, line numbers, and similarity scores.

---

## 🧑‍💻 Development

```bash
# Clone and install
git clone https://github.com/your-username/contextflow-mcp
cd contextflow-mcp
npm install

# Development (watch mode)
npm run dev

# Build
npm run build

# Run
npm start
```

### Project structure

```
contextflow-mcp/
├── src/
│   └── index.ts          # MCP server source (TypeScript, 164 lines)
├── dist/
│   └── index.js          # Compiled binary (committed, ready to ship)
├── package.json
├── tsconfig.json
└── claude-config-example.json
```

---

## 📋 Requirements

- Node.js ≥ 18
- A running [Contextflow](https://contextflow.app) instance with a valid snapshot token

---

## 📄 License

MIT © Miller Zamora
