"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
      </svg>
    ),
    title: "Semantic Memory",
    desc: "Every log, error, and event is embedded and searchable by meaning — not keywords.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    ),
    title: "Incident Clustering",
    desc: "Similar errors auto-group into incidents. Track recurrence, severity, and resolution patterns.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 3v18" /><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" />
        <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M6 18c0-4 4-6 12-9" />
      </svg>
    ),
    title: "Commit-Linked Debugging",
    desc: "Every bug is linked to the commit that introduced it — blame view, timeline, and fix history.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "AI Root Cause Analysis",
    desc: "Ask questions in plain English. Get root cause, impact, fix, and pattern detection instantly.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
      </svg>
    ),
    title: "OpenClaw Integration",
    desc: "Auto-recall and auto-capture memory across agents. Short-term + long-term memory scopes.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "API-First Platform",
    desc: "REST API, VS Code extension, GitHub Actions, Python SDK — integrate with your entire workflow.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-3 flex justify-between items-center sticky top-0 z-50 bg-bg/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2a7 7 0 0 0-4 12.73V22l4-2 4 2v-7.27A7 7 0 0 0 12 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            Memex<span className="text-accent ml-0.5">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/docs" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] transition">
            API Docs
          </a>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary text-[13px]">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary text-[13px]">
              Dashboard →
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-16 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-[11px] text-[var(--text-secondary)] tracking-wide mb-8 animate-slideDown">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
            Powered by OpenClaw · HackPSU 2026
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 animate-slideUp">
            Your system&apos;s memory,{" "}
            <span className="bg-gradient-to-r from-accent via-blue-400 to-accent bg-clip-text text-transparent">
              upgraded.
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10 animate-slideUp stagger-1">
            The institutional memory layer for your entire stack. Every error, every fix, every deploy — remembered, connected, and queryable.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 animate-slideUp stagger-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn btn-primary px-8 py-3 text-[14px]">
                  Get Started Free →
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-primary px-8 py-3 text-[14px]">
                Open Dashboard →
              </Link>
            </SignedIn>
            <a href="/docs" className="btn btn-ghost px-6 py-3 text-[14px]">
              View API Docs
            </a>
          </div>
        </div>

        {/* Terminal demo */}
        <div className="max-w-2xl w-full mx-auto mt-16 animate-slideUp stagger-3">
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xl shadow-accent/5">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-bg-raised">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 text-[11px] text-[var(--text-tertiary)] font-mono">memex query</span>
            </div>
            <div className="p-5 font-mono text-[13px] leading-7">
              <div className="text-[var(--text-secondary)]">
                <span className="text-accent">$</span> memex query &quot;null pointer auth service&quot;
              </div>
              <div className="mt-3 pl-3 border-l-2 border-accent/30">
                <div className="text-[var(--text-secondary)] text-[12px] mb-1">Root Cause Analysis</div>
                <div className="text-[var(--text)]">
                  Session expiry during token refresh cycle in AuthController.java:142
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="badge bg-red-muted text-[var(--red)]">critical</span>
                  <span className="badge bg-green-muted text-[var(--green)]">resolved</span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">commit: a3f9b2c · 94% match</span>
                </div>
              </div>
              <div className="mt-3 text-[var(--text-tertiary)] text-[12px]">
                ⚡ Pattern: 2 related incidents across 3 days
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="max-w-4xl w-full mx-auto mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent/20 transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center text-accent mb-3 group-hover:bg-accent/20 transition">
                  {f.icon}
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Before/After */}
        <div className="max-w-2xl w-full mx-auto mt-20 grid grid-cols-2 gap-4 animate-slideUp" style={{ animationDelay: "0.7s" }}>
          <div className="p-5 rounded-xl border border-[var(--red)]/20 bg-[var(--red-muted)]">
            <div className="text-[11px] font-semibold text-[var(--red)] uppercase tracking-wider mb-2">Without Memex</div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Dig through logs for 30 minutes. Maybe find the answer. Probably not. Context lost every sprint.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[var(--green)]/20 bg-[var(--green-muted)]">
            <div className="text-[11px] font-semibold text-[var(--green)] uppercase tracking-wider mb-2">With Memex</div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Ask a question. Get root cause, the fix, and which commit introduced it. In 2 seconds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 flex justify-between text-[11px] text-[var(--text-tertiary)]">
        <span>Memex AI v3.0 · Incident Intelligence Platform</span>
        <span>pgvector · OpenAI · OpenClaw · Next.js</span>
      </footer>
    </div>
  );
}
