"use client";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  placeholder: string;
  color: string;
  isSearching: boolean;
}

export default function SearchBar({
  query,
  onQueryChange,
  onSearch,
  placeholder,
  color,
  isSearching,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2.5 bg-[#0d0d0f] border border-[#1a1a1f] rounded-lg px-4 py-3 focus-within:border-[#333] transition-colors">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-[#555] shrink-0"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
      <span className="text-[13px] font-semibold shrink-0" style={{ color }}>
        $
      </span>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none text-[13px] text-[#e0e0e5] font-mono outline-none placeholder:text-[#333]"
      />
      <button
        onClick={onSearch}
        disabled={isSearching}
        className="px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-opacity disabled:opacity-50"
        style={{ background: color, color: "#000" }}
      >
        {isSearching ? "..." : "Search"}
      </button>
    </div>
  );
}
