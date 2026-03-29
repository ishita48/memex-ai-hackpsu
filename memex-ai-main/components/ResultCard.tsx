"use client";

interface ResultCardProps {
  reasoning: string | null;
  color: string;
  isLoading: boolean;
}

export default function ResultCard({ reasoning, color, isLoading }: ResultCardProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-lg p-4 mb-4"
        style={{
          background: `linear-gradient(135deg, ${color}08, ${color}04)`,
          border: `1px solid ${color}25`,
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
          </svg>
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            Analyzing Memory...
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                background: color,
                opacity: 0.4,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!reasoning) return null;

  return (
    <div
      className="rounded-lg p-4 mb-4 animate-[fadeIn_0.4s_ease]"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}04)`,
        border: `1px solid ${color}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
        </svg>
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color }}
        >
          Root Cause Analysis
        </span>
      </div>
      <p className="text-xs text-[#ccc] leading-7 font-mono m-0">{reasoning}</p>
    </div>
  );
}
