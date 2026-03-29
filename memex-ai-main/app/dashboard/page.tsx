"use client";

import { useState, useCallback, useEffect } from "react";
import type { SponsorMode } from "@/types";
import SearchBar from "@/components/SearchBar";
import MemoryList from "@/components/MemoryList";
import ResultCard from "@/components/ResultCard";
import IngestPanel from "@/components/IngestPanel";
import StatsBar from "@/components/StatsBar";
import IncidentList from "@/components/IncidentList";
import AlertBanner from "@/components/AlertBanner";

const MODE_CONFIG = {
  sentry: {
    label: "Sentry",
    icon: "🔴",
    color: "#ff2d55",
    tagline: "AI Error Memory",
    placeholder: "e.g. 'null pointer auth service' or 'timeout webhook'",
  },
  comcast: {
    label: "Comcast",
    icon: "📡",
    color: "#00b4d8",
    tagline: "Network Intelligence",
    placeholder: "e.g. 'bandwidth spike tonight' or 'latency chicago'",
  },
  base44: {
    label: "Base44",
    icon: "🧱",
    color: "#bf5af2",
    tagline: "Dev Infra Memory",
    placeholder: "e.g. 'schema rollback deploy' or 'performance orders'",
  },
} as const;

type View = "search" | "ingest" | "incidents" | "alerts";

export default function DashboardPage() {
  const [mode, setMode] = useState<SponsorMode>("sentry");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<View>("search");
  const [error, setError] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  const config = MODE_CONFIG[mode];

  useEffect(() => {
    fetch("/api/alerts?unread=true")
      .then((r) => r.json())
      .then((d) => setAlertCount(d.alerts?.length || 0))
      .catch(() => {});
  }, [view]);

  useEffect(() => {
    setResults(null);
    setReasoning(null);
    setPattern(null);
    setQuery("");
    setError(null);
  }, [mode]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setError(null);
    setReasoning(null);
    setPattern(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, mode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Query failed");
      }

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

  const handleIngest = useCallback(
    async (content: string, source: string, metadata?: Record<string, any>) => {
      const typeMap = { sentry: "error", comcast: "network", base44: "api" } as const;

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeMap[mode],
          source: source || "manual-input",
          content,
          metadata: metadata || { source, status: "new", ingested_via: "dashboard" },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ingest failed");
      }

      return res.json();
    },
    [mode]
  );

  const handleFeedback = useCallback(
    async (memoryId: string, action: string) => {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory_id: memoryId, action }),
      });
    },
    []
  );

  const views: { key: View; label: string; badge?: number }[] = [
    { key: "search", label: "⌕ Query" },
    { key: "incidents", label: "⚡ Incidents" },
    { key: "ingest", label: "↓ Ingest" },
    { key: "alerts", label: "🚨 Alerts", badge: alertCount },
  ];

  return (
    <div className="min-h-screen font-mono text-[#e0e0e5]">
      <header className="border-b border-[#111114] px-6 py-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}80)` }}
          >
            🧠
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">
              MEMEX <span style={{ color: config.color }}>AI</span>
              <span className="text-[9px] text-[#333] ml-2 font-normal">v2.0</span>
            </div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest">
              {config.tagline}
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-[#0d0d0f] p-0.5 rounded-lg border border-[#1a1a1f]">
          {(["sentry", "comcast", "base44"] as SponsorMode[]).map((key) => {
            const cfg = MODE_CONFIG[key];
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: mode === key ? cfg.color + "20" : "transparent",
                  color: mode === key ? cfg.color : "#555",
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-5 py-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="relative px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all border"
              style={{
                borderColor: view === v.key ? config.color + "40" : "#1a1a1f",
                background: view === v.key ? config.color + "10" : "transparent",
                color: view === v.key ? config.color : "#555",
              }}
            >
              {v.label}
              {v.badge && v.badge > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ff2d55] text-[9px] text-white flex items-center justify-center font-bold">
                  {v.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {view === "search" && (
          <>
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              onSearch={handleSearch}
              placeholder={config.placeholder}
              color={config.color}
              isSearching={isSearching}
            />

            {error && (
              <div className="mt-4 p-3 rounded-lg border border-[#ff2d5530] bg-[#ff2d5508] text-xs text-[#ff2d55]">
                {error}
              </div>
            )}

            {pattern && (
              <div
                className="mt-4 p-3 rounded-lg border text-xs font-mono animate-[fadeIn_0.4s_ease]"
                style={{
                  borderColor: config.color + "30",
                  background: config.color + "08",
                  color: config.color,
                }}
              >
                ⚡ Pattern Detected: {pattern}
              </div>
            )}

            {results && results.length > 0 && (
              <>
                <StatsBar results={results} color={config.color} />
                <ResultCard reasoning={reasoning} color={config.color} isLoading={isSearching} />
                <MemoryList results={results} color={config.color} onFeedback={handleFeedback} />
              </>
            )}

            {results && results.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3 opacity-40">∅</div>
                <div className="text-xs text-[#555] mb-2">No matching memories found.</div>
                <div className="text-[11px] text-[#333]">
                  Try a different query, or{" "}
                  <button onClick={() => setView("ingest")} className="underline" style={{ color: config.color }}>
                    ingest this incident
                  </button>{" "}
                  to build memory.
                </div>
              </div>
            )}

            {!results && !isSearching && !error && (
              <div className="text-center py-16 animate-[fadeIn_0.5s_ease]">
                <div className="text-4xl mb-3 opacity-60">{config.icon}</div>
                <div className="text-xs text-[#555] mb-1">
                  {config.label} mode — hybrid search active
                </div>
                <div className="text-[11px] text-[#333]">
                  Searches by meaning + keywords. Press Enter to browse all.
                </div>
              </div>
            )}
          </>
        )}

        {view === "incidents" && <IncidentList mode={mode} color={config.color} />}
        {view === "ingest" && <IngestPanel color={config.color} mode={mode} onIngest={handleIngest} />}
        {view === "alerts" && <AlertBanner color={config.color} />}
      </main>

      <footer className="border-t border-[#111114] px-6 py-3 flex justify-between text-[10px] text-[#333] tracking-wider font-mono flex-wrap gap-2">
        <span>MEMEX AI v2.0 — Incident Intelligence Engine</span>
        <span>hybrid search + clustering + feedback + alerts</span>
      </footer>
    </div>
  );
}