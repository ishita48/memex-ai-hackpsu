"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080a] text-[#e0e0e5] font-mono flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1a1a1f] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#bf5af2] to-[#ff2d55] flex items-center justify-center text-base">
            🧠
          </div>
          <span className="text-sm font-bold tracking-tight">
            MEMEX <span className="text-[#bf5af2]">AI</span>
          </span>
        </div>
                <div className="flex items-center gap-4">
          <a href="/docs" className="text-xs text-[#777] hover:text-[#999] transition">
            API Docs
          </a>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#bf5af2] text-black rounded-md hover:opacity-90 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#bf5af2] text-black rounded-md hover:opacity-90 transition"
            >
              Dashboard →
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1a1a1f] text-[10px] text-[#555] uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
            Hackathon Build — Sentry × Comcast × Base44
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            Your system&apos;s memory,{" "}
            <span className="bg-gradient-to-r from-[#ff2d55] via-[#bf5af2] to-[#00b4d8] bg-clip-text text-transparent">
              upgraded.
            </span>
          </h1>

          <p className="text-sm text-[#777] leading-relaxed max-w-md mx-auto mb-10">
            Every system collects data — logs, errors, events. But that data is
            wasted because it&apos;s not usable. Memex AI turns that data into
            memory, and that memory into decisions.
          </p>

          {/* Three pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: "🔴",
                label: "Sentry",
                desc: "AI error memory — know when it happened before and how it was fixed",
                color: "#ff2d55",
              },
              {
                icon: "📡",
                label: "Comcast",
                desc: "Network intelligence — predict spikes and explain anomalies",
                color: "#00b4d8",
              },
              {
                icon: "🧱",
                label: "Base44",
                desc: "Dev infra memory — trace deploys, rollbacks, and root causes",
                color: "#bf5af2",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-lg border border-[#1a1a1f] bg-[#0d0d0f] text-left"
              >
                <div className="text-xl mb-2">{s.icon}</div>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: s.color }}
                >
                  {s.label}
                </div>
                <div className="text-[11px] text-[#777] leading-relaxed">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Before/After */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12">
            <div className="p-4 rounded-lg border border-[#ff2d5530] bg-[#ff2d5508] text-left">
              <div className="text-[10px] text-[#ff2d55] font-bold uppercase tracking-wider mb-2">
                Without Memex
              </div>
              <div className="text-xs text-[#777]">
                Dig through logs for 30 minutes. Maybe find the answer. Maybe
                not.
              </div>
            </div>
            <div className="p-4 rounded-lg border border-[#30d15830] bg-[#30d15808] text-left">
              <div className="text-[10px] text-[#30d158] font-bold uppercase tracking-wider mb-2">
                With Memex
              </div>
              <div className="text-xs text-[#777]">
                Ask a question. Get the answer, root cause, and fix in 2
                seconds.
              </div>
            </div>
          </div>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff2d55] via-[#bf5af2] to-[#00b4d8] text-white rounded-lg hover:opacity-90 transition">
                Try the Demo →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff2d55] via-[#bf5af2] to-[#00b4d8] text-white rounded-lg hover:opacity-90 transition"
            >
              Open Dashboard →
            </Link>
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#111114] px-6 py-3 flex justify-between text-[10px] text-[#333] tracking-wider">
        <span>MEMEX AI v0.1.0</span>
        <span>pgvector + OpenAI + Next.js</span>
      </footer>
    </div>
  );
}
