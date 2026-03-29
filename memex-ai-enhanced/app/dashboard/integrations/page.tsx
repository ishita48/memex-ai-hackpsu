"use client";

import { useState, useEffect } from "react";

type ConnectState = Record<string, boolean>;

export default function IntegrationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>("openclaw");
  const [connected, setConnected] = useState<ConnectState>({
    openclaw: true,
    vscode: true,
    api: true,
    github: false,
    sentry: false,
    slack: false,
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("https://your-app.vercel.app");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    // Load connection state from localStorage
    try {
      const saved = localStorage.getItem("memex_connections");
      if (saved) setConnected((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const toggleConnect = (id: string) => {
    setConnected((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("memex_connections", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const connectedCount = Object.values(connected).filter(Boolean).length;

  const INTEGRATIONS = [
    {
      id: "openclaw",
      name: "OpenClaw",
      description: "Auto-recall and auto-capture memory across AI agents. Short-term + long-term memory scopes with per-agent isolation.",
      icon: "🦞",
      badge: "Featured",
      features: [
        "memory_search — Semantic search across all stored memories",
        "memory_store — Save facts with auto-deduplication & categorization",
        "memory_list — Browse all memories with pagination",
        "memory_get — Retrieve a specific memory by ID",
        "memory_forget — Remove outdated or incorrect memories",
      ],
      connectContent: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Configuration</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["autoRecall", "true"],
                ["autoCapture", "true"],
                ["searchThreshold", "0.4"],
                ["topK", "5"],
                ["enableGraph", "false"],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-[12px] text-[var(--text-secondary)] font-mono">{key}</span>
                  <span className={`text-[12px] font-mono ${value === "true" ? "text-[var(--green)]" : value === "false" ? "text-[var(--red)]" : "text-accent"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Memory API Endpoint</div>
            <CopyBlock text={`${baseUrl}/api/memory`} id="oc-endpoint" copied={copied} onCopy={copy} />
          </div>
        </div>
      ),
    },
    {
      id: "vscode",
      name: "VS Code Extension",
      description: "Right-click any error to search Memex memory. Get root cause analysis, fix suggestions, and blame view inline.",
      icon: "💻",
      features: [
        "Error lookup from editor context",
        "Inline fix suggestions from memory",
        "Auto-ingest errors on save",
        "Code explain with AI reasoning",
      ],
      connectContent: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">VS Code Settings</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--text-secondary)] font-mono">memex.apiUrl</span>
                <CopyBlock text={baseUrl} id="vsc-url" copied={copied} onCopy={copy} small />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--text-secondary)] font-mono">memex.apiKey</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">→ Get from <a href="/dashboard/settings" className="text-accent hover:underline">Settings</a></span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Install</div>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Copy the <code className="text-accent bg-accent-muted px-1 rounded">memex-vscode/</code> folder from the project, then run:
            </p>
            <CopyBlock text="cd memex-vscode && npm install && npm run package" id="vsc-install" copied={copied} onCopy={copy} />
          </div>
        </div>
      ),
    },
    {
      id: "github",
      name: "GitHub Actions",
      description: "Automatically ingest CI/CD failures. Every broken build creates a memory linked to the commit that caused it.",
      icon: "🐙",
      features: [
        "Auto-report CI failures",
        "Commit SHA linking",
        "PR-level incident tracking",
        "Deployment memory trail",
      ],
      connectContent: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Webhook URL</div>
            <CopyBlock text={`${baseUrl}/api/webhook/github`} id="gh-webhook" copied={copied} onCopy={copy} />
          </div>
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Setup (3 steps)</div>
            <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
              <div><span className="text-accent font-mono mr-1">1.</span> Add <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">MEMEX_URL</code> and <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">MEMEX_API_KEY</code> as GitHub repo secrets</div>
              <div><span className="text-accent font-mono mr-1">2.</span> Copy the workflow YAML from <a href="/dashboard/settings" className="text-accent hover:underline">Settings</a></div>
              <div><span className="text-accent font-mono mr-1">3.</span> Push to repo — failures will auto-report</div>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-border">
            <div className="px-3 py-1.5 bg-bg-raised border-b border-border flex justify-between items-center">
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">Quick test (curl)</span>
              <button onClick={() => copy(testCurl(baseUrl, "github"), "gh-curl")} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                {copied === "gh-curl" ? "✓" : "Copy"}
              </button>
            </div>
            <pre className="p-3 text-[10px] font-mono leading-5 overflow-x-auto text-[var(--text-secondary)]"><code>{testCurl(baseUrl, "github")}</code></pre>
          </div>
        </div>
      ),
    },
    {
      id: "sentry",
      name: "Sentry",
      description: "Import Sentry issues as Memex memories. Track error patterns across releases with semantic clustering.",
      icon: "🔴",
      features: [
        "Issue import via webhook",
        "Release correlation",
        "Stack trace embedding",
        "Severity auto-classification",
      ],
      connectContent: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Webhook URL</div>
            <CopyBlock text={`${baseUrl}/api/webhook/sentry`} id="sentry-webhook" copied={copied} onCopy={copy} />
          </div>
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Setup</div>
            <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
              <div><span className="text-accent font-mono mr-1">1.</span> Sentry → Settings → Integrations → Internal Integration</div>
              <div><span className="text-accent font-mono mr-1">2.</span> Add webhook URL above</div>
              <div><span className="text-accent font-mono mr-1">3.</span> Subscribe to <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">issue</code> events</div>
              <div><span className="text-accent font-mono mr-1">4.</span> Create alert rule → webhook action → select this integration</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "slack",
      name: "Slack Bot",
      description: "Query Memex from Slack. Get root cause analysis in your incident channel without leaving the conversation.",
      icon: "💬",
      features: [
        "Slash command /memex query",
        "Alert forwarding to channels",
        "Incident thread creation",
        "Resolution notifications",
      ],
      connectContent: () => (
        <div className="p-4 rounded-lg bg-bg border border-border">
          <div className="text-[12px] text-[var(--text-secondary)]">
            Slack integration requires OAuth and a Slack App. For the hackathon demo, you can simulate this by using the REST API from a Slack webhook or Zapier integration.
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-tertiary)]">
            Full Slack OAuth is on the roadmap. For now, use incoming webhooks + your API key.
          </div>
        </div>
      ),
    },
    {
      id: "api",
      name: "REST API",
      description: "Full programmatic access. Ingest, query, manage incidents, and configure alerts from any language or platform.",
      icon: "🔗",
      features: [
        "POST /api/ingest — Store memories",
        "POST /api/query — Semantic search with AI reasoning",
        "POST /api/memory — OpenClaw-compatible memory tools",
        "GET /api/incidents — List and manage incidents",
        "POST /api/feedback — Rate search results",
        "GET /api/alerts — Manage alert notifications",
      ],
      connectContent: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-bg border border-border">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Base URL</div>
            <CopyBlock text={baseUrl} id="api-base" copied={copied} onCopy={copy} />
          </div>
          <div className="rounded-lg overflow-hidden border border-border">
            <div className="px-3 py-1.5 bg-bg-raised border-b border-border flex justify-between items-center">
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">Example: semantic search</span>
              <button onClick={() => copy(`curl -X POST ${baseUrl}/api/query \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_KEY" \\\n  -d '{"question":"auth timeout","mode":"sentry"}'`, "api-curl")} className="text-[10px] text-[var(--text-tertiary)]">
                {copied === "api-curl" ? "✓" : "Copy"}
              </button>
            </div>
            <pre className="p-3 text-[10px] font-mono leading-5 overflow-x-auto text-[var(--text-secondary)]"><code>{`curl -X POST ${baseUrl}/api/query \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{"question":"auth timeout","mode":"sentry"}'`}</code></pre>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Get your API key from <a href="/dashboard/settings" className="text-accent hover:underline">Settings</a> · Full docs at <a href="/docs" className="text-accent hover:underline">/docs</a>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="h-[var(--header-height)] border-b border-border px-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold">Integrations</h1>
          <span className="text-[12px] text-[var(--text-tertiary)]">{connectedCount} connected</span>
        </div>
        <a href="/dashboard/settings" className="btn btn-ghost text-[12px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          API Keys &amp; Webhooks
        </a>
      </header>

      <div className="max-w-[960px] mx-auto px-6 py-6">
        {/* OpenClaw hero card */}
        <div className="mb-8 p-6 rounded-2xl gradient-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-xl">🦞</div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">OpenClaw Memory</h2>
                  <span className="badge bg-accent-muted text-accent">Featured</span>
                </div>
                <p className="text-[12px] text-[var(--text-tertiary)]">Powered by Mem0 · Long-term memory for AI agents</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4 max-w-xl">
              OpenClaw turns Memex AI into a persistent memory layer for any AI agent. Auto-recall injects relevant context before every response. Auto-capture extracts and stores key facts after every interaction.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Auto-Recall", desc: "Inject relevant memories before agent responds", active: true },
                { label: "Auto-Capture", desc: "Extract and store facts after agent responds", active: true },
                { label: "Agent Isolation", desc: "Per-agent namespaces for multi-agent setups", active: true },
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-lg bg-bg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${f.active ? "bg-[var(--green)] animate-pulse-dot" : "bg-[var(--text-tertiary)]"}`} />
                    <span className="text-[12px] font-semibold">{f.label}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integration grid */}
        <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">All Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INTEGRATIONS.map((integration, i) => {
            const isExp = expandedId === integration.id;
            const isConn = connected[integration.id];
            return (
              <div
                key={integration.id}
                className={`rounded-xl border bg-surface transition-all cursor-pointer animate-slideUp hover:bg-surface-hover ${
                  isExp ? "border-accent/20 col-span-1 md:col-span-2" : "border-border"
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => setExpandedId(isExp ? null : integration.id)}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-xl border border-border">
                        {integration.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-semibold">{integration.name}</h3>
                          {integration.badge && <span className="badge bg-accent-muted text-accent text-[9px]">{integration.badge}</span>}
                        </div>
                        <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 max-w-md">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isConn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--green-muted)] text-[var(--green)] text-[11px] font-semibold">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse-dot" />
                          Connected
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary text-[11px] py-1.5"
                          onClick={() => { toggleConnect(integration.id); setExpandedId(integration.id); }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-border px-5 py-4 animate-slideDown" onClick={(e) => e.stopPropagation()}>
                    {/* Capabilities */}
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Capabilities</div>
                    <div className="flex flex-col gap-1.5 mb-4">
                      {integration.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span className="text-[12px] text-[var(--text-secondary)] font-mono">{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Connection setup */}
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-2 mt-4 pt-4 border-t border-border">
                      {isConn ? "Setup & Configuration" : "How to Connect"}
                    </div>
                    {integration.connectContent()}

                    {/* Disconnect option */}
                    {isConn && !["openclaw", "api"].includes(integration.id) && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <button onClick={() => toggleConnect(integration.id)} className="text-[11px] text-[var(--red)] hover:underline">
                          Disconnect {integration.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────
function CopyBlock({ text, id, copied, onCopy, small = false }: {
  text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void; small?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${small ? "" : "mt-1"}`}>
      <code className={`${small ? "text-[10px]" : "text-[11px]"} font-mono text-accent bg-accent-muted px-2 py-1 rounded flex-1 ${small ? "" : "break-all"}`}>
        {text}
      </code>
      <button onClick={() => onCopy(text, id)} className="btn btn-ghost text-[10px] py-1 px-2 shrink-0">
        {copied === id ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function testCurl(baseUrl: string, type: "github" | "sentry") {
  if (type === "github") {
    return `curl -X POST ${baseUrl}/api/webhook/github \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "error",
    "source": "github-actions",
    "content": "CI failed: Build on main",
    "severity": "high",
    "title": "CI Failed: Build on main",
    "commit": "abc1234"
  }'`;
  }
  return `curl -X POST ${baseUrl}/api/webhook/sentry \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "TypeError: Cannot read null",
    "source": "sentry",
    "severity": "high",
    "title": "TypeError in auth module"
  }'`;
}
