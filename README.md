# contextflow-mcp

> MCP server for **Contextflow** — semantic code search and AI-powered Q&A over vectorized repositories, directly inside Claude.

## 🚀 What is this?

`contextflow-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude to a **Contextflow snapshot** — a vectorized index of your codebase. Once connected, Claude can:

- 🔍 Semantically search your code
- 💬 Answer natural language questions grounded in actual source code
- 📦 Inspect snapshot metadata (files indexed, status, branch)

---

## 🛠️ Tools exposed

| Tool | Description |
|------|-------------|
| `get_context_info` | Returns metadata about the snapshot: name, branch, status, files and chunks indexed |
| `search_context` | Semantic search — returns the most relevant code chunks with file paths and line numbers |
| `ask_context` | AI Q&A — asks a question and gets an answer grounded in real source code |

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configure Claude

Add the following to your Claude MCP config (`claude_desktop_config.json` or equivalent):

```json
{
  "mcpServers": {
    "contextflow": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "CONTEXTFLOW_TOKEN": "YOUR_SNAPSHOT_PUBLIC_TOKEN",
        "CONTEXTFLOW_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

See `claude-config-example.json` for a ready-to-copy template.

---

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONTEXTFLOW_TOKEN` | ✅ Yes | — | Public token of the Contextflow snapshot |
| `CONTEXTFLOW_API_URL` | No | `http://localhost:3001` | Base URL of the Contextflow API |

---

## 📁 Project Structure

```
contextflow-mcp/
├── src/
│   └── index.ts          # MCP server source (TypeScript)
├── dist/
│   └── index.js          # Compiled output (Node.js)
├── package.json
├── tsconfig.json
└── claude-config-example.json
```

---

## 🧑‍💻 Development

```bash
npm run dev    # watch mode (tsc --watch)
npm run build  # single compile
npm start      # run compiled server
```

---

## 📄 License

MIT
