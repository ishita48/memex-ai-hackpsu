"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Memories",
    href: "/dashboard/memory",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    label: "Timeline",
    href: "/dashboard/timeline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 3v18" /><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" />
        <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 18c0-4 4-6 12-9" />
      </svg>
    ),
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
      </svg>
    ),
  },
];

const SECONDARY_ITEMS = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    label: "API Docs",
    href: "/docs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" /><path d="M16 13H8m8 4H8m2-8H8" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-bg-raised border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 h-[var(--header-height)] flex items-center border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[14px] font-bold tracking-tight">
              Memex<span className="text-accent">AI</span>
            </span>
            <span className="text-[9px] text-[var(--text-tertiary)] ml-1.5">v3.0</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-accent-muted text-accent border border-accent/15"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-surface"
              }`}
            >
              <span className={active ? "text-accent" : "text-[var(--text-tertiary)]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Secondary nav */}
      <div className="px-3 pb-2 flex flex-col gap-1">
        {SECONDARY_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-accent-muted text-accent border border-accent/15"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-surface"
              }`}
            >
              <span className={active ? "text-accent" : "text-[var(--text-tertiary)]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 flex flex-col gap-1 border-t border-border pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-surface transition"
          >
            <span className="text-[var(--text-tertiary)]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="px-3 py-2 flex items-center gap-3">
          <UserButton
            appearance={{
              elements: { avatarBox: "w-7 h-7" },
            }}
          />
          <span className="text-[13px] text-[var(--text-secondary)]">Account</span>
        </div>
      </div>
    </aside>
  );
}
