"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [masterKey, setMasterKey] = useState({ masked: "Loading...", exists: false });
  const [webhookUrl, setWebhookUrl] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((d) => {
        setMasterKey(d.master_key || { masked: "Not configured", exists: false });
        setWebhookUrl(d.webhook_url || window.location.origin);
      })
      .catch(() => {});
  }, []);

  const generateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default Key" }),
      });
      const data = await res.json();
      setGeneratedKey(data.key);
      setNewKeyName("");
    } catch {}
    setGenerating(false);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = webhookUrl || (typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app");

  return (
    <div className="min-h-screen">
      <header className="h-[var(--header-height)] border-b border-border px-6 flex items-center sticky top-0 bg-bg/80 backdrop-blur-xl z-30">
        <h1 className="text-[15px] font-semibold">Settings</h1>
      </header>

      <div className="max-w-[720px] mx-auto px-6 py-8 space-y-8">
        {/* ─── API KEY ─── */}
        <section>
          <h2 className="text-[14px] font-semibold mb-1">API Key</h2>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Use this key to authenticate external requests to your Memex API.
          </p>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            {/* Master key display */}
            <div>
              <label className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider block mb-1.5">Master API Key (from env)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 input-base font-mono text-[12px] bg-bg flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">{masterKey.masked}</span>
                </div>
                {masterKey.exists && (
                  <button
                    onClick={() => copyText(process.env.NEXT_PUBLIC_MEMEX_API_KEY || "Check .env for MEMEX_API_KEY", "master")}
                    className="btn btn-ghost text-[11px] shrink-0"
                  >
                    {copied === "master" ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">
                Set via <code className="text-accent bg-accent-muted px-1 rounded text-[10px]">MEMEX_API_KEY</code> environment variable in Vercel.
              </p>
            </div>

            {/* Generate new key */}
            <div className="border-t border-border pt-4">
              <label className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider block mb-1.5">Generate New Key</label>
              <div className="flex items-center gap-2">
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. VS Code, CI/CD)"
                  className="input-base text-[13px] flex-1"
                />
                <button onClick={generateKey} disabled={generating} className="btn btn-primary text-[12px] shrink-0">
                  {generating ? "..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Show generated key */}
            {generatedKey && (
              <div className="p-4 rounded-lg border border-[var(--green)]/20 bg-[var(--green-muted)] animate-slideUp">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-[12px] font-semibold text-[var(--green)]">Key Generated — save it now, it won&apos;t be shown again!</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[12px] font-mono text-[var(--text)] bg-bg px-3 py-2 rounded-lg border border-border break-all select-all">{generatedKey}</code>
                  <button onClick={() => copyText(generatedKey, "gen")} className="btn btn-ghost text-[11px] shrink-0">
                    {copied === "gen" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── WEBHOOK URLs ─── */}
        <section>
          <h2 className="text-[14px] font-semibold mb-1">Webhook URLs</h2>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Use these URLs to send events from GitHub Actions, Sentry, and other services.
          </p>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {[
              { label: "GitHub Actions", path: "/api/webhook/github", desc: "Receives workflow_run failure events" },
              { label: "Sentry", path: "/api/webhook/sentry", desc: "Receives issue alert webhooks" },
              { label: "Generic Ingest", path: "/api/ingest", desc: "Universal ingest endpoint (requires API key)" },
              { label: "Memory API", path: "/api/memory", desc: "OpenClaw-compatible memory tools" },
            ].map((wh) => (
              <div key={wh.path} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium">{wh.label}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">{wh.desc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <code className="text-[11px] font-mono text-accent bg-accent-muted px-2 py-1 rounded max-w-[300px] truncate">
                    {baseUrl}{wh.path}
                  </code>
                  <button
                    onClick={() => copyText(`${baseUrl}${wh.path}`, wh.path)}
                    className="btn btn-ghost text-[10px] py-1 px-2"
                  >
                    {copied === wh.path ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── GITHUB ACTIONS SETUP ─── */}
        <section>
          <h2 className="text-[14px] font-semibold mb-1">GitHub Actions Setup</h2>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Add this to your workflow to auto-report CI failures to Memex.
          </p>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-raised">
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">.github/workflows/memex.yml</span>
              <button onClick={() => copyText(githubYaml(baseUrl), "yaml")} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                {copied === "yaml" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono leading-6 overflow-x-auto text-[var(--text-secondary)]">
              <code>{githubYaml(baseUrl)}</code>
            </pre>
          </div>

          <div className="mt-3 p-4 rounded-xl border border-border bg-surface">
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Setup Steps</div>
            <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">1.</span> Go to your repo → Settings → Secrets → Actions</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">2.</span> Add <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">MEMEX_URL</code> = <code className="text-[var(--text-tertiary)] text-[11px]">{baseUrl}</code></div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">3.</span> Add <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">MEMEX_API_KEY</code> = your API key from above</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">4.</span> Add the workflow YAML above to your repo</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">5.</span> Push a failing commit — Memex will capture it automatically</div>
            </div>
          </div>
        </section>

        {/* ─── SENTRY SETUP ─── */}
        <section>
          <h2 className="text-[14px] font-semibold mb-1">Sentry Setup</h2>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Point Sentry&apos;s webhook integration at your Memex endpoint.
          </p>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Setup Steps</div>
            <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">1.</span> In Sentry → Settings → Integrations → Internal Integrations</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">2.</span> Create integration, add webhook URL:</div>
              <div className="ml-6">
                <code className="text-[11px] font-mono text-accent bg-accent-muted px-2 py-1 rounded">{baseUrl}/api/webhook/sentry</code>
              </div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">3.</span> Subscribe to: <code className="text-[11px] text-accent">issue</code> events</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">4.</span> Create alert rule → send to this webhook on new issues</div>
            </div>
          </div>
        </section>

        {/* ─── VS CODE EXTENSION ─── */}
        <section>
          <h2 className="text-[14px] font-semibold mb-1">VS Code Extension</h2>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
            Install the Memex AI extension to search memories and get AI explanations from your editor.
          </p>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Quick Start</div>
            <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">1.</span> Download the extension from the Integrations page or install manually</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">2.</span> Open VS Code Settings → search &quot;Memex&quot;</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">3.</span> Set <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">memex.apiUrl</code> = <code className="text-[var(--text-tertiary)] text-[11px]">{baseUrl}</code></div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">4.</span> Set <code className="text-accent bg-accent-muted px-1 rounded text-[11px]">memex.apiKey</code> = your API key</div>
              <div className="flex gap-2"><span className="text-accent font-mono text-[12px]">5.</span> Right-click any error → &quot;Memex: Search Memory&quot; or &quot;Memex: Explain Error&quot;</div>
            </div>
          </div>
        </section>

        <div className="text-[11px] text-[var(--text-tertiary)] pt-4 border-t border-border">
          Memex AI v3.0 · All webhook endpoints accept JSON POST requests
        </div>
      </div>
    </div>
  );
}

function githubYaml(baseUrl: string) {
  return `name: Memex AI Reporter

on:
  workflow_run:
    workflows: ["*"]
    types: [completed]

jobs:
  report-failure:
    if: \${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Report CI Failure to Memex AI
        run: |
          curl -s -X POST "${baseUrl}/api/webhook/github" \\
            -H "Content-Type: application/json" \\
            -d '{
              "type": "error",
              "source": "github-actions",
              "content": "CI failed: \${{ github.event.workflow_run.name }} on \${{ github.event.workflow_run.head_branch }}",
              "severity": "high",
              "title": "CI Failed: \${{ github.event.workflow_run.name }}",
              "commit": "\${{ github.event.workflow_run.head_sha }}",
              "metadata": {
                "repo": "\${{ github.repository }}",
                "branch": "\${{ github.event.workflow_run.head_branch }}",
                "run_url": "\${{ github.event.workflow_run.html_url }}",
                "actor": "\${{ github.event.workflow_run.actor.login }}"
              }
            }'`;
}
