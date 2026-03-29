"use client";

import { useState, useEffect } from "react";

const SEV_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

const TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  error: { label: "Error", icon: "🔴", color: "#f43f5e" },
  network: { label: "Network", icon: "📡", color: "#3b82f6" },
  api: { label: "Infra", icon: "🧱", color: "#6d5cff" },
};

function timeAgo(ts: string) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "error" | "network" | "api">("all");
  const [sevFilter, setSevFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const modes = typeFilter === "all" ? ["sentry", "comcast", "base44"] : [typeFilter === "error" ? "sentry" : typeFilter === "network" ? "comcast" : "base44"];
    Promise.all(
      modes.map((m) =>
        fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "", mode: m }) })
          .then((r) => r.json())
      )
    )
      .then((results) => {
        let all = results.flatMap((r) => r.results || []);

        // Apply filters
        if (sevFilter !== "all") all = all.filter((m: any) => m.metadata?.severity === sevFilter);
        if (statusFilter === "resolved") all = all.filter((m: any) => m.resolved || m.metadata?.status === "resolved");
        if (statusFilter === "active") all = all.filter((m: any) => !m.resolved && m.metadata?.status !== "resolved");

        all.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMemories(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter, sevFilter, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === memories.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(memories.map((m) => m.id)));
  };

  return (
    <div className="min-h-screen">
      <header className="h-[var(--header-height)] border-b border-border px-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-[15px] font-semibold">Memories</h1>
          <span className="text-[12px] text-[var(--text-tertiary)] font-mono">{memories.length} total</span>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-accent">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-ghost text-[11px]">Clear</button>
          </div>
        )}
      </header>

      <div className="max-w-[960px] mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-1 bg-surface p-0.5 rounded-lg border border-border">
            {(["all", "error", "network", "api"] as const).map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${
                  typeFilter === f ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)]"
                }`}
              >
                {f === "all" ? "All Types" : TYPE_MAP[f]?.icon + " " + TYPE_MAP[f]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-surface p-0.5 rounded-lg border border-border">
            {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
              <button key={f} onClick={() => setSevFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  sevFilter === f ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)]"
                }`}
              >
                {f === "all" ? "All Sev" : f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-surface p-0.5 rounded-lg border border-border">
            {(["all", "active", "resolved"] as const).map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === f ? "bg-accent-muted text-accent" : "text-[var(--text-tertiary)]"
                }`}
              >
                {f === "all" ? "All Status" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="rounded-t-xl border border-border bg-surface-hover px-4 py-2 grid grid-cols-[32px_1fr_100px_100px_80px_60px] gap-3 items-center text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
          <div>
            <input type="checkbox" checked={selectedIds.size === memories.length && memories.length > 0} onChange={selectAll}
              className="w-3.5 h-3.5 rounded border-border accent-accent" />
          </div>
          <div>Memory</div>
          <div>Source</div>
          <div>Severity</div>
          <div>Status</div>
          <div className="text-right">Age</div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[13px] text-[var(--text-tertiary)]">Loading memories...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20 border border-t-0 border-border rounded-b-xl bg-surface">
            <div className="text-4xl mb-3 opacity-30">🧠</div>
            <div className="text-[13px] text-[var(--text-secondary)]">No memories match your filters.</div>
          </div>
        ) : (
          <div className="border border-t-0 border-border rounded-b-xl overflow-hidden">
            {memories.map((m: any, i: number) => {
              const sev = m.metadata?.severity || "medium";
              const sv = SEV_STYLES[sev] || SEV_STYLES.medium;
              const type = TYPE_MAP[m.type] || TYPE_MAP.error;
              const isResolved = m.resolved || m.metadata?.status === "resolved";
              const title = m.metadata?.title || m.content?.slice(0, 80);
              const isExp = expandedId === m.id;
              const isSelected = selectedIds.has(m.id);

              return (
                <div key={m.id}>
                  <div
                    className={`px-4 py-3 grid grid-cols-[32px_1fr_100px_100px_80px_60px] gap-3 items-center cursor-pointer transition-all hover:bg-surface-hover animate-slideUp ${
                      isSelected ? "bg-accent-muted/30" : i % 2 === 0 ? "bg-surface" : "bg-bg-raised"
                    } ${isResolved ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${i * 0.02}s` }}
                    onClick={() => setExpandedId(isExp ? null : m.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)}
                        className="w-3.5 h-3.5 rounded border-border accent-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{title}</div>
                      {m.metadata?.commit && (
                        <span className="text-[10px] text-[var(--blue)] font-mono">⊙ {m.metadata.commit}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">{type.icon}</span>
                      <span className="text-[12px] text-[var(--text-secondary)]">{m.source}</span>
                    </div>
                    <div>
                      <span className="badge" style={{ color: sv.color, background: sv.bg }}>{sev}</span>
                    </div>
                    <div>
                      {isResolved ? (
                        <span className="badge bg-[var(--green-muted)] text-[var(--green)]">resolved</span>
                      ) : (
                        <span className="badge bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)]">active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] text-right">{timeAgo(m.created_at)}</div>
                  </div>

                  {isExp && (
                    <div className="px-4 py-4 bg-bg border-t border-b border-border animate-slideDown">
                      <p className="text-[12px] text-[var(--text-secondary)] leading-7 font-mono whitespace-pre-wrap mb-3">{m.content}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(m.metadata || {}).map(([k, v]) => (
                          <span key={k} className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border text-[var(--text-tertiary)] font-mono">
                            {k}: <span className="text-[var(--text-secondary)]">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                      {m.incident_id && (
                        <div className="mt-3 text-[11px] text-[var(--text-tertiary)]">
                          Incident: <span className="font-mono text-accent">{m.incident_id.slice(0, 8)}</span>
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
    </div>
  );
}
