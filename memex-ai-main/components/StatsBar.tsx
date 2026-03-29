"use client";

interface StatsBarProps {
  results: any[];
  color: string;
}

export default function StatsBar({ results, color }: StatsBarProps) {
  const critical = results.filter(
    (m) => m.metadata?.severity === "critical" || m.metadata?.status === "active"
  ).length;
  const resolved = results.filter(
    (m) =>
      m.metadata?.status === "resolved" ||
      m.metadata?.status === "mitigated" ||
      m.metadata?.status === "rolled back"
  ).length;
  const avgSim = results.length
    ? results.reduce((a, m) => a + (m.similarity || 0), 0) / results.length
    : 0;

  const stats = [
    { label: "Results", value: results.length, color },
    { label: "Critical", value: critical, color: "#ff2d55" },
    { label: "Resolved", value: resolved, color: "#30d158" },
    ...(avgSim > 0
      ? [{ label: "Avg Match", value: `${(avgSim * 100).toFixed(0)}%`, color: "#ffd60a" }]
      : []),
  ];

  return (
    <div className="flex gap-4 py-2.5 border-b border-[#111114] mb-4 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono" style={{ color: s.color }}>
            {s.value}
          </span>
          <span className="text-[10px] text-[#555] uppercase tracking-widest">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
