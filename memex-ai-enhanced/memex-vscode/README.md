# Memex AI — VS Code Extension

Search your system's memory, get AI root cause analysis, and debug faster — right from your editor.

## Features

- **Search Memory** — Select any error text, right-click → "Memex: Search Memory" to find similar past incidents
- **Explain Error** — Select an error/exception, right-click → "Memex: Explain Error" for AI-powered root cause analysis
- **Explain Line** — Right-click any line → "Memex: Explain This Line" for a code explanation
- **Store in Memory** — Select an error, right-click → "Memex: Store in Memory" to save it for future reference

## Setup

1. Install the extension
2. Open VS Code Settings (Cmd+, or Ctrl+,)
3. Search for "Memex"
4. Set `memex.apiUrl` to your deployed Memex AI URL (e.g., `https://your-app.vercel.app`)
5. Set `memex.apiKey` to your API key (get it from Settings in the dashboard)

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `memex.apiUrl` | `http://localhost:3000` | URL of your Memex AI instance |
| `memex.apiKey` | (empty) | Your Memex API key |
| `memex.autoIngest` | `false` | Auto-ingest terminal errors |

## How It Works

The extension calls your Memex AI backend API:

- **Search**: `POST /api/memory` with `action: "search"`
- **Explain**: `POST /api/explain` with error/line context
- **Ingest**: `POST /api/ingest` with selected text + file metadata

No OAuth, no login — just your API key.

## Development

```bash
cd memex-vscode
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Build VSIX

```bash
npm run package
# Creates memex-ai-1.0.0.vsix
# Install: code --install-extension memex-ai-1.0.0.vsix
```
