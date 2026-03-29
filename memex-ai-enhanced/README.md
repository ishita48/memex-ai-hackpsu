# 🧠 Memex AI — Your System's Memory, Upgraded

> Semantic memory engine for observability. Search errors, network events, and API traces by **meaning**, not keywords.

**Sponsors:** Sentry × Comcast × Base44

---

## What It Does

Every system collects data — logs, errors, events. But that data is **wasted** because it's not usable. Memex AI turns that data into memory, and that memory into decisions.

- **For Sentry:** AI error memory — know when bugs happened before and how they were fixed
- **For Comcast:** Network intelligence — predict bandwidth spikes and explain anomalies
- **For Base44:** Dev infra memory — trace deploys, rollbacks, and root causes

### The Differentiator

We don't just retrieve results — we explain **root cause and resolution**. That's the difference between observability and intelligence.

---

## Architecture

```
User → Next.js Frontend → API Routes → Memory Engine → Supabase (pgvector)
                                      ↓
                                   OpenAI (embeddings + reasoning)
```

**Stack:** Next.js 14 (App Router) + Clerk + Supabase + pgvector + OpenAI

---

## Quick Start (Hackathon Speed)

### 1. Clone & Install

```bash
git clone <your-repo>
cd memex-ai
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase-setup.sql`
3. Click **Run** — this creates the `memories` table, pgvector extension, and `match_memories` function

### 3. Set Up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Copy your publishable key and secret key

### 4. Set Up OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)

### 5. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` → from Supabase dashboard → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` → from Supabase dashboard → Settings → API → service_role (secret)
- `OPENAI_API_KEY` → your OpenAI key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → from Clerk dashboard
- `CLERK_SECRET_KEY` → from Clerk dashboard

### 6. Seed Demo Data

```bash
npm run dev
```

Then in another terminal (or browser):

```bash
curl -X POST http://localhost:3000/api/seed
```

This loads 15 prebuilt memories across all 3 sponsor modes.

### 7. Done!

Open [http://localhost:3000](http://localhost:3000) and start querying.

---

## Project Structure

```
memex-ai/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx                  ← Root layout + Clerk
│   ├── globals.css
│   ├── (dashboard)/
│   │   ├── page.tsx                ← Main dashboard UI
│   │   └── layout.tsx
│   └── api/
│       ├── ingest/route.ts         ← POST: store data
│       ├── query/route.ts          ← POST: search + reason
│       └── seed/route.ts           ← POST: load demo data
├── lib/
│   ├── memory.ts                   ← Core engine (ingest + query + browse)
│   ├── supabase.ts                 ← Supabase client
│   └── openai.ts                   ← OpenAI client
├── components/
│   ├── SearchBar.tsx
│   ├── MemoryList.tsx
│   ├── ResultCard.tsx
│   ├── IngestPanel.tsx
│   └── StatsBar.tsx
├── types/index.ts
├── middleware.ts                    ← Clerk auth middleware
├── supabase-setup.sql              ← Run this in Supabase SQL Editor
└── .env.local.example
```

---

## How It Works (For Judges)

### Ingest Flow
```
User input → OpenAI embedding (text-embedding-3-small) → Store in Supabase (pgvector)
```

"We convert unstructured data into embeddings so we can search by meaning, not keywords."

### Query Flow
```
Question → embedding → cosine similarity search → LLM reasoning (gpt-4o-mini)
```

1. Embed the question
2. Search similar vectors in DB via pgvector
3. Pass results to LLM
4. Generate root cause analysis

"We retrieve the most relevant past events, then use an LLM to explain why they matter."

---

## Demo Script

1. Open dashboard, switch to **Sentry** tab
2. Search: `"null pointer auth service"`
3. Show: root cause analysis + matching error + commit reference
4. Say: *"This crash happened 2 days ago — here's the fix we used then."*
5. Switch to **Comcast** tab
6. Search: `"bandwidth spike"`
7. Show: prediction for tonight at 9:10 PM with 94% confidence
8. Say: *"Every Tuesday and Friday at 9:10 PM, bandwidth spikes. We predict it."*
9. Switch to **Base44** tab
10. Search: `"schema rollback"`
11. Show: 2nd incident this month, CI fix recommendation
12. Say: *"We don't just tell you it broke — we tell you why, and how to prevent it."*

### The Pitch

> "Today, Sentry tells you an error happened. We tell you **when it happened before**, **how it was fixed**, and **which commit resolved it**. That's the difference between observability and intelligence."

---

## Sponsor Prize Strategy

| Sponsor | Demo Moment | Prize Angle |
|---------|------------|-------------|
| **Sentry** | NullPointerException → "fixed in commit a3f9b2c" | Extended observability with AI memory |
| **Comcast** | Bandwidth spike → "predicted for tonight at 9:10 PM" | Customer experience + network reliability |
| **Base44** | Schema rollback → "2nd incident this month, add CI validation" | Backend infrastructure intelligence |

---

## Tech Stack

- **Next.js 14** — App Router, API routes, server components
- **Clerk** — Authentication (each user gets private memory)
- **Supabase** — Postgres database with pgvector extension
- **pgvector** — Cosine similarity search directly in Postgres
- **OpenAI** — text-embedding-3-small (embeddings) + gpt-4o-mini (reasoning)
- **Tailwind CSS** — Styling
