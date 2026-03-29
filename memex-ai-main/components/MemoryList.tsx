"use client";

import { useState } from "react";

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: "#ff2d5522", border: "#ff2d55", text: "#ff2d55" },
  high: { bg: "#ff9f0a22", border: "#ff9f0a", text: "#ff9f0a" },
  medium: { bg: "#ffd60a22", border: "#ffd60a", text: "#ffd60a" },
  low: { bg: "#30d15822", border: "#30d158", text: "#30d158" },
  resolved: { bg: "#30d15815", border: "#30d158", text: "#30d158" },
  active: { bg: "#ff9f0a15", border: "#ff9f0a", text: "#ff9f0a" },
  mitigated: { bg: "#5e5ce615", border: "#5e5ce6", text: "#5e5ce6" },
  "rolled back": { bg: "#ff375f15", border: "#ff375f", text: "#ff375f" },
  new: { bg: "#00b4d815", border: "#00b4d8", text: "#00b4d8" },
  open: { bg: "#ff2d5515", border: "#ff2d55", text: "#ff2d55" },
  investigating: { bg: "#ff9f0a15", border: "#ff9f0a", text: "#ff9f0a" },
};

function MemoryCard({
  memory,
  color,
  index,
  onFeedback,
}: {
  memory: any;
  color: string;
  index: number;
  onFeedback?: (id: string, action: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const severityKey = memory.metadata?.severity || memory.metadata?.status || "medium";
  const colors = SEVERITY_COLORS[severityKey] || SEVERITY_COLORS.medium;
  const title = memory.metadata?.title || memory.content?.slice(0, 100) || "Untitled";

  const handleFeedback = (action: string) => {
    if (feedbackGiven) return;
    setFeedbackGiven(action);
    onFeedback?.(memory.id, action);
  };

  return (
    <div
      className="bg-[#0d0d0f] border border-[#1a1a1f] rounded-lg p-4 cursor-pointer transition-all hover:bg-[#111114]"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: colors.border,
        animation: `fadeSlideIn 0.4s ease ${index * 0.06}s both`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono"
              style={{ color: colors.text, background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              {severityKey}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider font-mono text-[#aaa] bg-[#ffffff08] border border-[#ffffff10]">
              {memory.source}
            </span>
            {memory.resolved && (
              <span className="text-[9px] text-[#30d158] font-mono">✓ resolved</span>
            )}
            {memory.incident_id && (
              <span className="text-[9px] text-[#555] font-mono">
                incident:{memory.incident_id.slice(0, 8)}
              </span>
            )}
            <span className="text-[10px] text-[#444]">
              {formatTimeAgo(new Date(memory.created_at))}
            </span>
          </div>
          <div className="text-[12px] text-[#e0e0e5] leading-relaxed font-mono break-words">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {memory.feedback_score !== undefined && memory.feedback_score !== 0 && (
            <span className="text-[10px] font-mono" style={{ color: memory.feedback_score > 0 ? "#30d158" : "#ff2d55" }}>
              {memory.feedback_score > 0 ? "+" : ""}{memory.feedback_score}
            </span>
          )}
          {memory.similarity && (
            <span className="text-[11px] font-mono opacity-80" style={{ color }}>
              {(memory.similarity * 100).toFixed(0)}%
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-[#444] transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1f] animate-[fadeIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
          <p className="text-[11px] text-[#999] leading-7 font-mono m-0 mb-3">{memory.content}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(memory.metadata || {}).map(([k, v]) => (
              <span key={k} className="text-[9px] px-2 py-0.5 rounded bg-[#ffffff06] border border-[#ffffff10] text-[#666] font-mono">
                {k}: <span className="text-[#aaa]">{String(v)}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#444] uppercase tracking-widest mr-1">Feedback:</span>
            <button
              onClick={() => handleFeedback("helpful")}
              disabled={!!feedbackGiven}
              className="px-2 py-0.5 rounded text-[10px] font-mono border transition-all"
              style={{
                borderColor: feedbackGiven === "helpful" ? "#30d15840" : "#1a1a1f",
                background: feedbackGiven === "helpful" ? "#30d15815" : "transparent",
                color: feedbackGiven === "helpful" ? "#30d158" : "#555",
                cursor: feedbackGiven ? "default" : "pointer",
              }}
            >
              👍 Helpful
            </button>
            <button
              onClick={() => handleFeedback("not_helpful")}
              disabled={!!feedbackGiven}
              className="px-2 py-0.5 rounded text-[10px] font-mono border transition-all"
              style={{
                borderColor: feedbackGiven === "not_helpful" ? "#ff2d5540" : "#1a1a1f",
                background: feedbackGiven === "not_helpful" ? "#ff2d5515" : "transparent",
                color: feedbackGiven === "not_helpful" ? "#ff2d55" : "#555",
                cursor: feedbackGiven ? "default" : "pointer",
              }}
            >
              👎 Not relevant
            </button>
            {!memory.resolved && (
              <button
                onClick={() => handleFeedback("resolve")}
                disabled={!!feedbackGiven}
                className="px-2 py-0.5 rounded text-[10px] font-mono border border-[#1a1a1f] text-[#555] hover:text-[#30d158] hover:border-[#30d15840] transition-all ml-auto"
                style={{ cursor: feedbackGiven ? "default" : "pointer" }}
              >
                ✓ Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

interface MemoryListProps {
  results: any[];
  color: string;
  onFeedback?: (id: string, action: string) => void;
}

export default function MemoryList({ results, color, onFeedback }: MemoryListProps) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((m: any, i: number) => (
        <MemoryCard key={m.id} memory={m} color={color} index={i} onFeedback={onFeedback} />
      ))}
    </div>
  );
}