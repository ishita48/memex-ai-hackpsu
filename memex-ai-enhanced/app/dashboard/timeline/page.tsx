"use client";

import { useState, useEffect } from "react";

const SEV_STYLES: Record<string, { color: string; bg: string; ring: string }> = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)", ring: "rgba(244,63,94,0.3)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", ring: "rgba(245,158,11,0.3)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)", ring: "rgba(234,179,8,0.3)" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.12)", ring: "rgba(16,185,129,0.3)" },
};

function timeAgo(ts: string) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TimelinePage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "error" | "network" | "api">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Browse all recent memories
    const modes = filter === "all" ? ["sentry", "comcast", "base44"] : [filter === "error" ? "sentry" : filter === "network" ? "comcast" : "base44"];
    Promise.all(
      modes.map((m) =>
        fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "", mode: m }),
        }).then((r) => r.json())
      )
    )
      .then((results) => {
        const all = results.flatMap((r) => r.results || []);
        all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMemories(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  // Group by date
  const grouped = memories.reduce((acc: Record<string, any[]>, m) => {
    const date = new Date(m.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  // Stats
  const commitLinked = memories.filter((m: any) => m.metadata?.commit).length;
  const resolvedCount = memories.filter((m: any) => m.resolved || m.metadata?.status === "resolved").length;
  const critCount = memories.filter((m: any) => m.metadata?.severity === "critical").length;

  return (
    <div className="min-h-screen">
      <header className="h-[var(--header-height)] border-b border-border px-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-[15px] font-semibold">Debug Timeline</h1>
          <span className="text-[11px] text-[var(--text-tertiary)]">Commit-linked incident history</span>
        </div>
        <div className="flex gap-1 bg-surface p-0.5 rounded-lg border border-border">
          {(["all", "error", "network", "api"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${
                filter === f ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f === "all" ? "All" : f === "error" ? "🔴 Errors" : f === "network" ? "📡 Network" : "🧱 Infra"}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Events", value: memories.length, color: "var(--accent)" },
            { label: "Commit-Linked", value: commitLinked, color: "var(--blue)" },
            { label: "Resolved", value: resolvedCount, color: "var(--green)" },
            { label: "Critical", value: critCount, color: "var(--red)" },
          ].map((s) => (
            <div key={s.label} className="stat-card p-4 rounded-xl border border-border bg-surface">
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[13px] text-[var(--text-tertiary)]">Loading timeline...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 opacity-30">📜</div>
            <div className="text-[13px] text-[var(--text-secondary)]">No events in timeline yet.</div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-8">
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center z-10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{date}</span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{items.length} events</span>
                </div>

                {/* Events */}
                <div className="flex flex-col gap-2 ml-5 pl-8 border-l border-border">
                  {items.map((m: any, i: number) => {
                    const sev = m.metadata?.severity || "medium";
                    const sv = SEV_STYLES[sev] || SEV_STYLES.medium;
                    const isExp = expandedId === m.id;
                    const commit = m.metadata?.commit;
                    const title = m.metadata?.title || m.content?.slice(0, 100);

                    return (
                      <div
                        key={m.id}
                        className="relative animate-slideUp"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        {/* Dot on timeline */}
                        <div
                          className="absolute -left-[calc(2rem+5.5px)] top-3.5 w-3 h-3 rounded-full border-2"
                          style={{ borderColor: sv.color, background: isExp ? sv.color : "var(--bg)" }}
                        />

                        <div
                          className={`rounded-xl border bg-surface cursor-pointer transition-all hover:bg-surface-hover ${isExp ? "border-accent/20" : "border-border"}`}
                          onClick={() => setExpandedId(isExp ? null : m.id)}
                        >
                          <div className="px-4 py-3">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="badge" style={{ color: sv.color, background: sv.bg }}>{sev}</span>
                                  <span className="badge bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]">{m.source}</span>
                                  {commit && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--blue)] font-mono bg-[var(--blue-muted)] px-1.5 py-0.5 rounded">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6"/></svg>
                                      {commit}
                                    </span>
                                  )}
                                  {(m.resolved || m.metadata?.status === "resolved") && (
                                    <span className="text-[10px] text-[var(--green)]">✓ resolved</span>
                                  )}
                                </div>
                                <div className="text-[13px] font-medium">{title}</div>
                              </div>
                              <div className="text-[11px] text-[var(--text-tertiary)] shrink-0">{formatDate(m.created_at)}</div>
                            </div>
                          </div>

                          {isExp && (
                            <div className="border-t border-border px-4 py-3 animate-slideDown" onClick={(e) => e.stopPropagation()}>
                              <p className="text-[12px] text-[var(--text-secondary)] leading-7 font-mono whitespace-pre-wrap mb-3">{m.content}</p>

                              {/* Blame view */}
                              {commit && (
                                <div className="mb-3 p-3 rounded-lg bg-bg border border-border-subtle">
                                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">Blame View</div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6"/>
                                      </svg>
                                      <span className="text-[12px] font-mono text-[var(--blue)]">{commit}</span>
                                    </div>
                                    {m.metadata?.service && (
                                      <span className="text-[11px] text-[var(--text-secondary)]">→ {m.metadata.service}</span>
                                    )}
                                    {m.metadata?.language && (
                                      <span className="badge bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)]">{m.metadata.language}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(m.metadata || {}).filter(([k]) => !["title", "commit", "severity", "status"].includes(k)).map(([k, v]) => (
                                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-border-subtle text-[var(--text-tertiary)] font-mono">
                                    {k}: <span className="text-[var(--text-secondary)]">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
