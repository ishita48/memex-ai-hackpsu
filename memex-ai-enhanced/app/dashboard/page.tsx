"use client";

import { useState, useCallback, useEffect } from "react";

// ─── TYPES ──────────────────────────────────────────────────────
type View = "search" | "incidents" | "ingest" | "alerts";

const SEV_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  open: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
  investigating: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  resolved: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

// ─── HELPERS ────────────────────────────────────────────────────
function timeAgo(ts: string) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [view, setView] = useState<View>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incFilter, setIncFilter] = useState("all");
  const [loadingInc, setLoadingInc] = useState(false);
  const [expandedInc, setExpandedInc] = useState<string | null>(null);
  const [incMemories, setIncMemories] = useState<any[]>([]);

  // Ingest state
  const [ingestContent, setIngestContent] = useState("");
  const [ingestSource, setIngestSource] = useState("");
  const [ingestSev, setIngestSev] = useState("medium");
  const [ingestStatus, setIngestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [ingestMsg, setIngestMsg] = useState("");

  // Mode (type filter)
  const [mode, setMode] = useState<"sentry" | "comcast" | "base44">("sentry");
  const modeMap = { sentry: "error", comcast: "network", base44: "api" } as const;

  useEffect(() => {
    fetch("/api/alerts?unread=true")
      .then((r) => r.json())
      .then((d) => {
        setAlertCount(d.alerts?.length || 0);
        setAlerts(d.alerts || []);
      })
      .catch(() => {});
  }, [view]);

  useEffect(() => {
    setResults(null);
    setReasoning(null);
    setPattern(null);
    setQuery("");
    setError(null);
  }, [mode]);

  // Fetch incidents
  useEffect(() => {
    if (view === "incidents") {
      setLoadingInc(true);
      const statusParam = incFilter === "all" ? "" : `&status=${incFilter}`;
      fetch(`/api/incidents?mode=${mode}${statusParam}`)
        .then((r) => r.json())
        .then((d) => setIncidents(d.incidents || []))
        .catch(() => {})
        .finally(() => setLoadingInc(false));
    }
  }, [view, mode, incFilter]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, mode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Query failed");
      const data = await res.json();
      setResults(data.results || []);
      setReasoning(data.reasoning || null);
      setPattern(data.pattern || null);
    } catch (err: any) {
      setError(err.message);
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, mode]);

  const handleFeedback = useCallback(async (memoryId: string, action: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_id: memoryId, action }),
    });
  }, []);

  const handleIngest = async () => {
    if (!ingestContent.trim()) return;
    setIngestStatus("loading");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modeMap[mode],
          source: ingestSource.trim() || "manual-input",
          content: ingestContent.trim(),
          metadata: { severity: ingestSev, source: ingestSource || "manual-input", status: "new", ingested_via: "dashboard" },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Ingest failed");
      setIngestStatus("success");
      setIngestMsg("Memory stored and embedded");
      setIngestContent("");
      setIngestSource("");
      setTimeout(() => setIngestStatus("idle"), 3000);
    } catch (err: any) {
      setIngestStatus("error");
      setIngestMsg(err.message);
      setTimeout(() => setIngestStatus("idle"), 4000);
    }
  };

  const acknowledgeAlert = async (id: string) => {
    await fetch("/api/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    setAlertCount((c) => Math.max(0, c - 1));
  };

  const toggleIncident = async (id: string) => {
    if (expandedInc === id) { setExpandedInc(null); return; }
    setExpandedInc(id);
    try {
      const res = await fetch(`/api/incidents?id=${id}`);
      const data = await res.json();
      setIncMemories(data.memories || []);
    } catch { setIncMemories([]); }
  };

  const updateIncStatus = async (id: string, status: string) => {
    await fetch("/api/incidents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, status } : inc)));
  };

  const views: { key: View; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "search", label: "Query", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    { key: "incidents", label: "Incidents", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4m0 4h.01"/></svg> },
    { key: "ingest", label: "Ingest", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
    { key: "alerts", label: "Alerts", badge: alertCount, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  ];

  const modeButtons = [
    { key: "sentry" as const, label: "Errors", icon: "🔴" },
    { key: "comcast" as const, label: "Network", icon: "📡" },
    { key: "base44" as const, label: "Infra", icon: "🧱" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-[var(--header-height)] border-b border-border px-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-[15px] font-semibold">Dashboard</h1>
          {/* Mode selector */}
          <div className="flex gap-1 bg-surface p-0.5 rounded-lg border border-border">
            {modeButtons.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${
                  mode === m.key ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                view === v.key ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-surface"
              }`}
            >
              {v.icon}
              {v.label}
              {v.badge && v.badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--red)] text-[9px] text-white flex items-center justify-center font-bold">
                  {v.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-[960px] mx-auto px-6 py-6">
        {/* ─── SEARCH VIEW ─── */}
        {view === "search" && (
          <div className="animate-fadeIn">
            {/* Search bar */}
            <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-accent/30 focus-within:shadow-[0_0_0_3px_rgba(109,92,255,0.08)] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search memories by meaning... e.g. 'null pointer auth' or 'timeout webhook'"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="btn btn-primary text-[12px] px-4 py-1.5"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg border border-[var(--red)]/20 bg-[var(--red-muted)] text-[13px] text-[var(--red)]">
                {error}
              </div>
            )}

            {pattern && (
              <div className="mt-4 p-3 rounded-lg border border-accent/20 bg-accent-muted text-[13px] text-accent font-mono animate-slideUp">
                ⚡ Pattern: {pattern}
              </div>
            )}

            {/* Results */}
            {results && results.length > 0 && (
              <>
                {/* Stats */}
                <div className="flex gap-6 py-4 border-b border-border mb-4 animate-slideUp">
                  {[
                    { label: "Results", value: results.length, color: "var(--accent)" },
                    { label: "Critical", value: results.filter((m: any) => m.metadata?.severity === "critical").length, color: "var(--red)" },
                    { label: "Resolved", value: results.filter((m: any) => m.metadata?.status === "resolved" || m.resolved).length, color: "var(--green)" },
                    ...(results[0]?.similarity ? [{ label: "Top Match", value: `${(results[0].similarity * 100).toFixed(0)}%`, color: "var(--orange)" }] : []),
                  ].map((s) => (
                    <div key={s.label} className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                      <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* AI Reasoning */}
                {reasoning && (
                  <div className="mb-4 p-4 rounded-xl border border-accent/15 bg-accent-muted/50 animate-slideUp stagger-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
                      </svg>
                      <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Root Cause Analysis</span>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-7 font-mono whitespace-pre-wrap">{reasoning}</p>
                  </div>
                )}

                {/* Memory list */}
                <div className="flex flex-col gap-2">
                  {results.map((m: any, i: number) => (
                    <MemoryCard key={m.id} memory={m} index={i} onFeedback={handleFeedback} />
                  ))}
                </div>
              </>
            )}

            {results && results.length === 0 && (
              <div className="text-center py-20">
                <div className="text-4xl mb-3 opacity-30">∅</div>
                <div className="text-[13px] text-[var(--text-secondary)] mb-1">No matching memories found.</div>
                <button onClick={() => setView("ingest")} className="text-[13px] text-accent hover:underline">
                  Ingest this incident →
                </button>
              </div>
            )}

            {!results && !isSearching && !error && (
              <div className="text-center py-20 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
                <div className="text-[14px] text-[var(--text-secondary)] mb-1">Hybrid search active</div>
                <div className="text-[13px] text-[var(--text-tertiary)]">
                  Searches by meaning + keywords. Press Enter to browse all memories.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── INCIDENTS VIEW ─── */}
        {view === "incidents" && (
          <div className="animate-fadeIn">
            <div className="flex gap-2 mb-4">
              {["all", "open", "investigating", "resolved"].map((f) => (
                <button key={f} onClick={() => setIncFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    incFilter === f ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-surface"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {loadingInc ? (
              <div className="text-center py-12 text-[13px] text-[var(--text-tertiary)]">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 text-[13px] text-[var(--text-tertiary)]">No incidents found.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {incidents.map((inc: any, i: number) => {
                  const st = STATUS_STYLES[inc.status] || STATUS_STYLES.open;
                  const sv = SEV_STYLES[inc.severity] || SEV_STYLES.medium;
                  const isExp = expandedInc === inc.id;
                  return (
                    <div key={inc.id} className="rounded-xl border border-border bg-surface overflow-hidden animate-slideUp" style={{ animationDelay: `${i * 0.04}s`, borderLeftWidth: 3, borderLeftColor: sv.color }}>
                      <div className="px-4 py-3 cursor-pointer hover:bg-surface-hover transition" onClick={() => toggleIncident(inc.id)}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="badge" style={{ color: st.color, background: st.bg }}>{inc.status}</span>
                              <span className="badge" style={{ color: sv.color, background: sv.bg }}>{inc.severity}</span>
                              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">{inc.event_count} events</span>
                            </div>
                            <div className="text-[13px] font-medium">{inc.title || "Untitled"}</div>
                          </div>
                          <div className="text-[11px] text-[var(--text-tertiary)]">{timeAgo(inc.last_seen)}</div>
                        </div>
                      </div>
                      {isExp && (
                        <div className="border-t border-border px-4 py-3 animate-slideDown">
                          <div className="flex gap-2 mb-3">
                            {inc.status !== "investigating" && <button onClick={() => updateIncStatus(inc.id, "investigating")} className="btn btn-ghost text-[11px] text-[var(--orange)]">Investigate</button>}
                            {inc.status !== "resolved" && <button onClick={() => updateIncStatus(inc.id, "resolved")} className="btn btn-ghost text-[11px] text-[var(--green)]">Resolve</button>}
                            {inc.status === "resolved" && <button onClick={() => updateIncStatus(inc.id, "open")} className="btn btn-ghost text-[11px] text-[var(--red)]">Reopen</button>}
                          </div>
                          <div className="text-[11px] text-[var(--text-tertiary)] mb-3">First seen: {timeAgo(inc.first_seen)} · Last seen: {timeAgo(inc.last_seen)}</div>
                          {incMemories.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Related Events ({incMemories.length})</div>
                              {incMemories.slice(0, 5).map((m: any) => (
                                <div key={m.id} className="p-2.5 rounded-lg bg-bg border border-border-subtle text-[12px] font-mono text-[var(--text-secondary)]">
                                  <span className="text-[10px] text-[var(--text-tertiary)]">{timeAgo(m.created_at)} · {m.source}</span>
                                  <div className="mt-1">{m.content.slice(0, 200)}{m.content.length > 200 ? "..." : ""}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── INGEST VIEW ─── */}
        {view === "ingest" && (
          <div className="animate-fadeIn max-w-2xl">
            <h2 className="text-[15px] font-semibold mb-4">Ingest Memory</h2>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={ingestSource} onChange={(e) => setIngestSource(e.target.value)} placeholder="Source (e.g. auth-service)" className="input-base" />
                <select value={ingestSev} onChange={(e) => setIngestSev(e.target.value)} className="input-base">
                  {["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea
                value={ingestContent}
                onChange={(e) => setIngestContent(e.target.value)}
                placeholder="Paste error log, stack trace, network alert, or deploy event..."
                rows={8}
                className="input-base mb-3 resize-y font-mono text-[12px] leading-relaxed"
              />
              <button onClick={handleIngest} disabled={!ingestContent.trim() || ingestStatus === "loading"} className="btn btn-primary text-[13px]">
                {ingestStatus === "loading" ? "Embedding..." : "Store in Memory"}
              </button>
            </div>
            {ingestStatus === "success" && <div className="mt-3 p-3 rounded-lg border border-[var(--green)]/20 bg-[var(--green-muted)] text-[13px] text-[var(--green)]">✓ {ingestMsg}</div>}
            {ingestStatus === "error" && <div className="mt-3 p-3 rounded-lg border border-[var(--red)]/20 bg-[var(--red-muted)] text-[13px] text-[var(--red)]">✗ {ingestMsg}</div>}
          </div>
        )}

        {/* ─── ALERTS VIEW ─── */}
        {view === "alerts" && (
          <div className="animate-fadeIn">
            {alerts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-3 opacity-30">🔔</div>
                <div className="text-[13px] text-[var(--text-secondary)]">No unread alerts. All clear!</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.map((alert: any, i: number) => {
                  const sv = SEV_STYLES[alert.severity] || SEV_STYLES.medium;
                  return (
                    <div key={alert.id} className="rounded-xl border border-border bg-surface px-4 py-3 animate-slideUp" style={{ animationDelay: `${i * 0.04}s`, borderLeftWidth: 3, borderLeftColor: sv.color, opacity: alert.acknowledged ? 0.5 : 1 }}>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge" style={{ color: sv.color, background: sv.bg }}>{alert.severity}</span>
                            <span className="text-[11px] text-[var(--text-tertiary)]">{timeAgo(alert.created_at)}</span>
                            {alert.acknowledged && <span className="text-[10px] text-[var(--green)]">✓ acknowledged</span>}
                          </div>
                          <div className="text-[13px] font-medium">{alert.title}</div>
                          {alert.message && <div className="text-[12px] text-[var(--text-secondary)] mt-1">{alert.message}</div>}
                        </div>
                        {!alert.acknowledged && (
                          <button onClick={() => acknowledgeAlert(alert.id)} className="btn btn-ghost text-[11px]">Ack</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEMORY CARD ────────────────────────────────────────────────
function MemoryCard({ memory, index, onFeedback }: { memory: any; index: number; onFeedback: (id: string, action: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const sev = memory.metadata?.severity || "medium";
  const sv = SEV_STYLES[sev] || SEV_STYLES.medium;
  const title = memory.metadata?.title || memory.content?.slice(0, 100) || "Untitled";

  const handleFeedback = (action: string) => {
    if (feedbackGiven) return;
    setFeedbackGiven(action);
    onFeedback(memory.id, action);
  };

  return (
    <div
      className="rounded-xl border border-border bg-surface hover:bg-surface-hover cursor-pointer transition-all animate-slideUp"
      style={{ animationDelay: `${index * 0.04}s`, borderLeftWidth: 3, borderLeftColor: sv.color }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-4 py-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="badge" style={{ color: sv.color, background: sv.bg }}>{sev}</span>
              <span className="badge bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]">{memory.source}</span>
              {memory.resolved && <span className="text-[10px] text-[var(--green)]">✓ resolved</span>}
              {memory.metadata?.commit && (
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-0.5">
                    <circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6"/>
                  </svg>
                  {memory.metadata.commit}
                </span>
              )}
              <span className="text-[10px] text-[var(--text-tertiary)]">{timeAgo(memory.created_at)}</span>
            </div>
            <div className="text-[13px] font-medium leading-relaxed">{title}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {memory.similarity && (
              <span className="text-[12px] font-mono text-accent font-semibold">{(memory.similarity * 100).toFixed(0)}%</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-4 py-3 animate-slideDown" onClick={(e) => e.stopPropagation()}>
          <p className="text-[12px] text-[var(--text-secondary)] leading-7 font-mono mb-3 whitespace-pre-wrap">{memory.content}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(memory.metadata || {}).map(([k, v]) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-border-subtle text-[var(--text-tertiary)] font-mono">
                {k}: <span className="text-[var(--text-secondary)]">{String(v)}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mr-1">Feedback:</span>
            <button onClick={() => handleFeedback("helpful")} disabled={!!feedbackGiven}
              className={`btn btn-ghost text-[11px] py-1 px-2 ${feedbackGiven === "helpful" ? "!bg-[var(--green-muted)] !text-[var(--green)] !border-[var(--green)]/20" : ""}`}>
              👍 Helpful
            </button>
            <button onClick={() => handleFeedback("not_helpful")} disabled={!!feedbackGiven}
              className={`btn btn-ghost text-[11px] py-1 px-2 ${feedbackGiven === "not_helpful" ? "!bg-[var(--red-muted)] !text-[var(--red)] !border-[var(--red)]/20" : ""}`}>
              👎 Not relevant
            </button>
            {!memory.resolved && (
              <button onClick={() => handleFeedback("resolve")} disabled={!!feedbackGiven} className="btn btn-ghost text-[11px] py-1 px-2 ml-auto">
                ✓ Resolve
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
