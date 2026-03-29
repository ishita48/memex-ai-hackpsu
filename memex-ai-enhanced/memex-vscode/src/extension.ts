import * as vscode from "vscode";

// ─── CONFIG ─────────────────────────────────────────────────────
function getConfig() {
  const config = vscode.workspace.getConfiguration("memex");
  return {
    apiUrl: config.get<string>("apiUrl") || "http://localhost:3000",
    apiKey: config.get<string>("apiKey") || "",
    autoIngest: config.get<boolean>("autoIngest") || false,
  };
}

// ─── API CALL ───────────────────────────────────────────────────
async function memexFetch(
  path: string,
  body: Record<string, unknown>
): Promise<any> {
  const { apiUrl, apiKey } = getConfig();

  if (!apiKey) {
    vscode.window.showWarningMessage(
      "Memex AI: No API key configured. Set memex.apiKey in VS Code settings."
    );
    return null;
  }

  try {
    const url = `${apiUrl.replace(/\/$/, "")}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    vscode.window.showErrorMessage(`Memex AI: ${err.message}`);
    return null;
  }
}

// ─── SEARCH MEMORY ──────────────────────────────────────────────
async function searchMemory() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.document.getText(editor.selection);
  if (!selection.trim()) {
    vscode.window.showInformationMessage("Memex: Select text to search.");
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "memexSearch",
    `Memex: Search Results`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = loadingHtml("Searching memory...");

  // Search across all modes
  const result = await memexFetch("/api/memory", {
    action: "search",
    query: selection.trim(),
    top_k: 5,
    threshold: 0.3,
  });

  if (!result) {
    panel.webview.html = errorHtml("Search failed. Check your API key and URL.");
    return;
  }

  const memories = result.memories || [];
  panel.webview.html = searchResultsHtml(selection.trim(), memories);
}

// ─── EXPLAIN ERROR ──────────────────────────────────────────────
async function explainError() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.document.getText(editor.selection);
  if (!selection.trim()) {
    vscode.window.showInformationMessage("Memex: Select an error to explain.");
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "memexExplain",
    "Memex: Error Explanation",
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = loadingHtml("Analyzing error...");

  const result = await memexFetch("/api/explain", {
    code: selection.trim(),
    filename: editor.document.fileName,
    language: editor.document.languageId,
    type: "error",
  });

  if (!result) {
    panel.webview.html = errorHtml("Explanation failed.");
    return;
  }

  panel.webview.html = explanationHtml(selection.trim(), result.explanation);
}

// ─── EXPLAIN LINE ───────────────────────────────────────────────
async function explainLine() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const line = editor.document.lineAt(editor.selection.active.line);
  const text = line.text.trim();

  if (!text) {
    vscode.window.showInformationMessage("Memex: Empty line.");
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "memexExplainLine",
    "Memex: Line Explanation",
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = loadingHtml("Explaining line...");

  const result = await memexFetch("/api/explain", {
    code: text,
    filename: editor.document.fileName,
    language: editor.document.languageId,
    type: "line",
  });

  if (!result) {
    panel.webview.html = errorHtml("Explanation failed.");
    return;
  }

  panel.webview.html = explanationHtml(text, result.explanation);
}

// ─── INGEST ERROR ───────────────────────────────────────────────
async function ingestError() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.document.getText(editor.selection);
  if (!selection.trim()) {
    vscode.window.showInformationMessage("Memex: Select text to ingest.");
    return;
  }

  const severity = await vscode.window.showQuickPick(
    ["critical", "high", "medium", "low"],
    { placeHolder: "Select severity level" }
  );

  if (!severity) return;

  const result = await memexFetch("/api/ingest", {
    type: "error",
    source: "vscode",
    content: selection.trim(),
    metadata: {
      severity,
      title: selection.trim().split("\n")[0].slice(0, 80),
      filename: editor.document.fileName,
      language: editor.document.languageId,
      ingested_via: "vscode-extension",
    },
  });

  if (result?.success) {
    vscode.window.showInformationMessage(
      `Memex: Stored in memory (${result.is_new_incident ? "new incident" : "existing cluster"})`
    );
  }
}

// ─── HTML TEMPLATES ─────────────────────────────────────────────
const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 16px;
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    line-height: 1.6;
  }
  .card {
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-critical { background: rgba(244,63,94,0.15); color: #f43f5e; }
  .badge-high { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .badge-medium { background: rgba(234,179,8,0.15); color: #eab308; }
  .badge-low { background: rgba(16,185,129,0.15); color: #10b981; }
  .score { color: #6d5cff; font-weight: 700; font-family: monospace; }
  .mono { font-family: var(--vscode-editor-font-family), monospace; font-size: 12px; }
  .muted { color: var(--vscode-descriptionForeground); font-size: 12px; }
  h2 { font-size: 14px; margin: 0 0 8px; }
  h3 { font-size: 13px; margin: 0 0 4px; }
  pre {
    background: var(--vscode-textCodeBlock-background);
    border-radius: 6px;
    padding: 12px;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--vscode-foreground);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

function loadingHtml(msg: string) {
  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head>
  <body><div style="text-align:center;padding:40px">
    <div class="spinner"></div>
    <p class="muted" style="margin-top:12px">${msg}</p>
  </div></body></html>`;
}

function errorHtml(msg: string) {
  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head>
  <body><div class="card"><p style="color:#f43f5e">${msg}</p></div></body></html>`;
}

function searchResultsHtml(query: string, memories: any[]) {
  const items = memories
    .map((m: any) => {
      const sev = m.metadata?.severity || "medium";
      const score = m.score ? `${(m.score * 100).toFixed(0)}%` : "";
      const commit = m.metadata?.commit ? `<span class="muted">⊙ ${m.metadata.commit}</span>` : "";
      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div>
              <span class="badge badge-${sev}">${sev}</span>
              <span class="muted" style="margin-left:6px">${m.source || ""}</span>
              ${commit}
            </div>
            ${score ? `<span class="score">${score}</span>` : ""}
          </div>
          <h3>${escapeHtml(m.metadata?.title || m.content?.slice(0, 80) || "Untitled")}</h3>
          <pre>${escapeHtml(m.content || "")}</pre>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
    <h2>🧠 Memex Search: "${escapeHtml(query.slice(0, 60))}"</h2>
    <p class="muted">${memories.length} result${memories.length !== 1 ? "s" : ""} found</p>
    ${memories.length === 0 ? '<div class="card"><p class="muted">No matching memories. Try ingesting this error to build memory.</p></div>' : items}
  </body></html>`;
}

function explanationHtml(code: string, explanation: string) {
  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
    <h2>🧠 Memex Explanation</h2>
    <div class="card">
      <pre class="mono">${escapeHtml(code.slice(0, 500))}</pre>
    </div>
    <div class="card">
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.7">${escapeHtml(explanation)}</div>
    </div>
  </body></html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── ACTIVATE ───────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("memex.searchMemory", searchMemory),
    vscode.commands.registerCommand("memex.explainError", explainError),
    vscode.commands.registerCommand("memex.explainLine", explainLine),
    vscode.commands.registerCommand("memex.ingestError", ingestError)
  );

  // Status bar
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.text = "$(brain) Memex AI";
  statusBar.tooltip = "Memex AI — Incident Intelligence";
  statusBar.command = "memex.searchMemory";
  statusBar.show();
  context.subscriptions.push(statusBar);

  console.log("Memex AI extension activated");
}

export function deactivate() {}
