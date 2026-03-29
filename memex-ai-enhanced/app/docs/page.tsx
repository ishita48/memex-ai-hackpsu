"use client";

import { useState } from "react";

const SECTIONS = [
  { id: "auth", label: "Authentication" },
  { id: "ingest", label: "POST /api/ingest" },
  { id: "query", label: "POST /api/query" },
  { id: "memory", label: "Memory Tools" },
  { id: "incidents", label: "Incidents" },
  { id: "feedback", label: "Feedback" },
  { id: "alerts", label: "Alerts" },
  { id: "openclaw", label: "OpenClaw" },
  { id: "examples", label: "Integration Examples" },
];

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("auth");

  return (
    <div className="min-h-screen bg-bg text-[var(--text)] flex">
      <aside className="w-56 border-r border-border p-5 sticky top-0 h-screen overflow-y-auto hidden md:block">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
            </svg>
          </div>
          <span className="text-[14px] font-bold">API Docs</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${activeSection === s.id ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-surface"}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-border">
          <a href="/dashboard" className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
            &larr; Back to Dashboard
          </a>
        </div>
      </aside>

      <main className="flex-1 max-w-3xl mx-auto px-8 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2">Memex AI <span className="text-accent">API Reference</span></h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Integrate incident intelligence into any tool, pipeline, or AI agent workflow.</p>
        </div>

        <Section id="auth" title="Authentication">
          <P>All external API requests require an API key via header:</P>
          <Code>{`curl -X POST https://your-app.vercel.app/api/query \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{"question": "auth error", "mode": "sentry"}'`}</Code>
          <P muted>Also accepts <C>Authorization: Bearer your-api-key</C></P>
        </Section>

        <Section id="ingest" title="POST /api/ingest">
          <P>Store a log, error, or event. Auto-embeds, clusters into incidents, and triggers alerts.</P>
          <Code title="Request">{`{
  "type": "error",           // "error" | "network" | "api"
  "source": "auth-service",
  "content": "NullPointerException at AuthController.java:142...",
  "metadata": {
    "severity": "critical",
    "title": "NullPointerException in AuthController",
    "commit": "a3f9b2c"
  }
}`}</Code>
          <Code title="Response">{`{
  "success": true,
  "id": "uuid",
  "incident_id": "uuid",
  "is_new_incident": false,
  "alert_triggered": true
}`}</Code>
        </Section>

        <Section id="query" title="POST /api/query">
          <P>Hybrid semantic + keyword search with AI root cause analysis.</P>
          <Code title="Request">{`{
  "question": "null pointer auth",
  "mode": "sentry"    // "sentry" | "comcast" | "base44"
}`}</Code>
          <Code title="Response">{`{
  "results": [{
    "id": "uuid",
    "type": "error",
    "source": "auth-service",
    "content": "NullPointerException at AuthController...",
    "metadata": { "severity": "critical", "commit": "a3f9b2c" },
    "similarity": 0.94
  }],
  "reasoning": "**Root Cause:** Session expiry...",
  "pattern": "2 related incidents spanning 3 days"
}`}</Code>
        </Section>

        <Section id="memory" title="Memory Tools (OpenClaw Compatible)">
          <P>Mem0/OpenClaw-compatible memory management for agent integration.</P>
          <Code title="POST /api/memory/search">{`{
  "query": "authentication timeout",
  "scope": "all",      // "session" | "long-term" | "all"
  "top_k": 5,
  "threshold": 0.4
}`}</Code>
          <Code title="POST /api/memory/store">{`{
  "content": "Auth service crashes when token expires mid-refresh",
  "metadata": { "source": "preference", "agent": "assistant" },
  "longTerm": true
}`}</Code>
          <Code title="GET /api/memory/list">{`GET /api/memory/list?limit=20&offset=0`}</Code>
          <Code title="DELETE /api/memory/forget">{`{ "memory_id": "uuid" }`}</Code>
        </Section>

        <Section id="incidents" title="Incidents">
          <Code>{`GET /api/incidents?mode=sentry&status=open
GET /api/incidents?id=<incident-uuid>

PATCH /api/incidents
{
  "id": "incident-uuid",
  "status": "resolved",
  "root_cause": "Session expiry during token refresh",
  "fix": "Added null-safe chaining in commit a3f9b2c"
}`}</Code>
        </Section>

        <Section id="feedback" title="Feedback">
          <P>Rate search results to improve future rankings.</P>
          <Code>{`POST /api/feedback
{ "memory_id": "uuid", "action": "helpful" }`}</Code>
        </Section>

        <Section id="alerts" title="Alerts">
          <Code>{`GET /api/alerts              // all alerts
GET /api/alerts?unread=true  // unacknowledged only
PATCH /api/alerts  { "id": "alert-uuid" }`}</Code>
        </Section>

        <Section id="openclaw" title="OpenClaw Integration">
          <P>Memex AI integrates with OpenClaw as a memory backend with auto-recall and auto-capture.</P>
          <Code title="Plugin Config">{`{
  "id": "openclaw-mem0",
  "name": "Memory (Mem0)",
  "config": {
    "mode": "platform",
    "userId": "your-user-id",
    "autoRecall": true,
    "autoCapture": true,
    "searchThreshold": 0.4,
    "topK": 5,
    "enableGraph": false
  }
}`}</Code>
          <div className="my-4 p-4 rounded-xl border border-accent/15 bg-accent-muted/50">
            <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">How It Works</div>
            <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
              <div><strong className="text-[var(--text)]">Auto-Recall:</strong> Before the agent responds, Memex searches for relevant memories and injects them into context.</div>
              <div><strong className="text-[var(--text)]">Auto-Capture:</strong> After the agent responds, Memex extracts key facts and stores them with deduplication.</div>
              <div><strong className="text-[var(--text)]">Agent Isolation:</strong> Multi-agent setups get isolated namespaces automatically.</div>
              <div><strong className="text-[var(--text)]">Session vs Long-term:</strong> Session memories are conversation-scoped. Long-term memories persist across all sessions.</div>
            </div>
          </div>
        </Section>

        <Section id="examples" title="Integration Examples">
          <Code title="GitHub Actions">{`- name: Report to Memex AI
  if: failure()
  run: |
    curl -X POST $MEMEX_URL/api/ingest \\
      -H "x-api-key: $MEMEX_API_KEY" \\
      -d '{"type":"error","source":"github-actions",
           "content":"CI failed on $\{{ github.ref }}",
           "metadata":{"severity":"high","commit":"$\{{ github.sha }}"}}'`}</Code>

          <Code title="Python SDK">{`class MemexAI:
    def __init__(self, url, api_key):
        self.url = url
        self.headers = {"Content-Type": "application/json", "x-api-key": api_key}

    def ingest(self, content, source="python", severity="medium", **meta):
        return requests.post(f"{self.url}/api/ingest", json={
            "type": "error", "source": source, "content": content,
            "metadata": {"severity": severity, **meta}
        }, headers=self.headers).json()

    def query(self, question, mode="sentry"):
        return requests.post(f"{self.url}/api/query", json={
            "question": question, "mode": mode
        }, headers=self.headers).json()

    def search_memory(self, query, top_k=5):
        return requests.post(f"{self.url}/api/memory/search", json={
            "query": query, "top_k": top_k
        }, headers=self.headers).json()`}</Code>
        </Section>

        <div className="mt-12 pt-6 border-t border-border text-[11px] text-[var(--text-tertiary)]">
          Memex AI v3.0 &middot; Incident Intelligence Platform &middot; Powered by OpenClaw
        </div>
      </main>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-12 scroll-mt-8">
      <h2 className="text-[15px] font-bold text-accent mb-4 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function P({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <p className={`text-[13px] mb-3 leading-relaxed ${muted ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]"}`}>{children}</p>;
}

function C({ children }: { children: React.ReactNode }) {
  return <code className="text-accent bg-accent-muted px-1.5 py-0.5 rounded text-[12px] font-mono">{children}</code>;
}

function Code({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="mb-4 group relative">
      {title && <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">{title}</div>}
      <pre className="bg-surface border border-border rounded-xl p-4 text-[12px] leading-relaxed overflow-x-auto font-mono"><code>{children}</code></pre>
      <button onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-md bg-surface-hover border border-border text-[10px] text-[var(--text-tertiary)]"
        style={{ top: title ? "24px" : "8px" }}>
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
