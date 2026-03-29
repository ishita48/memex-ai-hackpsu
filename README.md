# 🧠 Memex AI v2.0 — Incident Intelligence Engine

> **Turn logs into memory. Turn memory into decisions.**

Memex AI is an AI-powered incident intelligence system that ingests logs, clusters related events into incidents, and uses hybrid semantic search + LLM reasoning to identify root causes, suggest fixes, detect patterns, and improve over time through user feedback.

Built for the **Sentry × Comcast × Base44** hackathon tracks.

---

## The Problem

Every engineering team collects logs — error traces, network events, API failures. But when something breaks:

1. Engineers open 5 different tools (Sentry, Datadog, Slack, CloudWatch, Grafana)
2. Manually search through thousands of log lines
3. Try to remember *"didn't this happen before?"*
4. Spend 30–60 minutes finding the root cause

**Memex AI replaces steps 2–4 with one question.**

Ask `"auth service failing"` and get back: *this happened 3 days ago, caused by expired session tokens, fixed in commit a3f9b2c, and it's the same pattern that fires every time you deploy auth-service.*

---

## How It Works

```
                                    ┌──────────────┐
                                    │   OpenAI     │
                                    │  Embeddings  │
                                    │  + Reasoning │
                                    └──────┬───────┘
                                           │
User ──→ Next.js Dashboard ──→ API Routes ──→ Memory Engine ──→ Supabase
              │                                    │               (pgvector)
              │                                    │
              │                                    ├── Hybrid Search (vector + keyword)
              │                                    ├── Incident Clustering
              │                                    ├── Feedback Reranking
              │                                    └── Alert Engine
              │
              └── Stream Simulator (optional live ingestion)
```

### Ingest Flow

1. Log enters via paste, structured form, file upload, or API
2. Content is embedded using OpenAI `text-embedding-3-small` (1536 dimensions)
3. System checks for similar existing memories (cosine similarity > 0.82)
4. If match found → clusters into existing incident
5. If no match → creates new incident
6. If severity is critical/high → auto-fires an alert
7. Memory stored with embedding, incident link, and metadata

### Query Flow

1. User asks a question (e.g., `"null pointer auth service"`)
2. Question is embedded via OpenAI
3. **Hybrid search** runs: vector cosine similarity + keyword matching via `ILIKE`
4. Results are **reranked** by: similarity score + feedback boost + recency decay
5. Top 5 results sent to GPT-4o-mini for **structured reasoning**:
   - **Root Cause** — what caused the issue
   - **Impact** — what was affected
   - **Fix** — specific action to take
   - **Pattern** — recurring trends or first occurrence
6. System checks if multiple incidents appear in results → pattern detection

---

## Features

### Core Intelligence

| Feature | Description |
|---------|-------------|
| **Hybrid Search** | Vector embeddings (semantic meaning) + keyword matching (exact terms). Finds results even when users don't know the exact error message. |
| **Incident Clustering** | Automatically groups similar events into incidents. Ingest 500 related logs → see 1 incident with 500 events, not 500 separate entries. |
| **AI Root Cause Analysis** | GPT-4o-mini analyzes retrieved results and outputs structured reasoning: root cause, impact, fix, and pattern detection. |
| **Feedback Loop** | Users rate results as helpful/not helpful. Feedback score boosts future search rankings. System gets smarter with use. |
| **Recency Decay** | Recent events rank higher. Uses exponential decay over a 1-week half-life so fresh incidents surface first. |
| **Pattern Detection** | When search results span multiple incidents, the system identifies and surfaces the recurring pattern. |

### Incident Management

| Feature | Description |
|---------|-------------|
| **Auto-Clustering** | New logs automatically join existing incidents if similarity > 82%. No manual grouping needed. |
| **Status Tracking** | Incidents move through: Open → Investigating → Resolved. Reopen if they recur. |
| **Event Timeline** | Expand any incident to see all related events with timestamps and sources. |
| **Alert Engine** | Critical and high severity events auto-generate alerts. Badge count on Alerts tab. Acknowledge individually or bulk. |

### Data Ingestion

| Feature | Description |
|---------|-------------|
| **Paste Raw Logs** | Paste any error log, stack trace, or event directly. Set source and severity. |
| **Structured Entry** | Form with title, source, service, severity, content, commit hash, and extra JSON metadata. |
| **File Upload** | Upload `.json`, `.csv`, `.txt`, or `.log` files. Each entry becomes a separate memory. Built-in CSV parser. |
| **API Endpoint** | `POST /api/ingest` — any external system can send data programmatically. |
| **Stream Simulator** | Node.js script that sends realistic logs every 5 seconds for live demos. |

### Multi-Domain Modes

The same backend powers three sponsor-specific views:

| Mode | Icon | Data Type | Example Query |
|------|------|-----------|---------------|
| **Sentry** | 🔴 | Errors | `"null pointer auth service"` |
| **Comcast** | 📡 | Network | `"bandwidth spike tonight"` |
| **Base44** | 🧱 | API/Infra | `"schema rollback deploy"` |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | React framework with server components |
| UI | Tailwind CSS + JetBrains Mono | Terminal-dashboard hybrid aesthetic |
| Auth | Clerk | User authentication + session management |
| Database | Supabase (PostgreSQL) | Hosted database with REST API |
| Vector Search | pgvector | Cosine similarity search on embeddings |
| Embeddings | OpenAI `text-embedding-3-small` | 1536-dimension text vectors |
| Reasoning | OpenAI `gpt-4o-mini` | Structured root cause analysis |
| Language | TypeScript | Full type safety across stack |

---

## Project Structure

```
memex-ai/
├── app/
│   ├── page.tsx                     ← Landing page
│   ├── layout.tsx                   ← Root layout + Clerk
│   ├── globals.css                  ← Tailwind + animations
│   ├── dashboard/
│   │   ├── page.tsx                 ← Main dashboard (4 views)
│   │   └── layout.tsx               ← Dashboard layout
│   └── api/
│       ├── ingest/route.ts          ← POST: embed + cluster + alert
│       ├── query/route.ts           ← POST: hybrid search + reasoning
│       ├── incidents/route.ts       ← GET/PATCH: incident management
│       ├── feedback/route.ts        ← POST: rate results
│       └── alerts/route.ts          ← GET/PATCH: alert management
├── lib/
│   ├── memory.ts                    ← Core engine (entire product)
│   ├── openai.ts                    ← OpenAI client
│   └── supabase.ts                  ← Supabase client
├── components/
│   ├── SearchBar.tsx                ← Terminal-style search
│   ├── MemoryList.tsx               ← Results with feedback
│   ├── ResultCard.tsx               ← AI reasoning panel
│   ├── StatsBar.tsx                 ← Metrics bar
│   ├── IngestPanel.tsx              ← 3-mode data entry
│   ├── IncidentList.tsx             ← Grouped incidents
│   └── AlertBanner.tsx              ← Alert management
├── scripts/
│   └── stream-simulator.js         ← Live ingestion demo
├── types/index.ts                   ← TypeScript interfaces
├── middleware.ts                    ← Clerk auth
└── supabase-setup-v2.sql           ← Database schema
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key
- Clerk account (free tier works)

### 1. Install

```bash
git clone <your-repo>
cd memex-ai
npm install
```

### 2. Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Paste the contents of `supabase-setup-v2.sql` and click **Run**
4. If prompted about destructive operations, click **"Run this query"**

This creates 3 tables (memories, incidents, alerts), 6 indexes, and 3 SQL functions.

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Landing page
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) → Dashboard

### 5. Stream Simulator (Optional)

In a second terminal:

```bash
node scripts/stream-simulator.js
```

Sends realistic logs every 5 seconds. Watch incidents cluster, alerts fire, and search results populate in real time.

---

## API Reference

### POST `/api/ingest`

Store a new memory with automatic embedding, clustering, and alerting.

```json
{
  "type": "error",
  "source": "auth-service",
  "content": "NullPointerException at AuthController.java:142...",
  "metadata": {
    "severity": "critical",
    "service": "auth-service",
    "title": "NullPointerException in AuthController"
  }
}
```

Response:

```json
{
  "success": true,
  "id": "uuid",
  "incident_id": "uuid",
  "is_new_incident": false,
  "alert_triggered": true,
  "message": "Memory added to existing incident cluster"
}
```

### POST `/api/query`

Hybrid search with AI reasoning.

```json
{
  "question": "null pointer auth",
  "mode": "sentry"
}
```

Response:

```json
{
  "results": [...],
  "reasoning": "**Root Cause:** Session expiry during token refresh...",
  "pattern": "2 related incidents detected spanning 3 days"
}
```

### GET `/api/incidents?mode=sentry&status=open`

List grouped incidents with event counts.

### POST `/api/feedback`

Rate a search result to improve future rankings.

```json
{
  "memory_id": "uuid",
  "action": "helpful"
}
```

### GET `/api/alerts?unread=true`

List unacknowledged alerts.

---

## Database Schema

### memories

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| type | text | `error`, `network`, or `api` |
| source | text | Service/node that generated it |
| content | text | Full log text |
| metadata | jsonb | Structured data (severity, commit, etc.) |
| embedding | vector(1536) | OpenAI embedding |
| incident_id | uuid | Links to parent incident |
| feedback_score | int | Cumulative user feedback (+1/-1) |
| resolved | boolean | Whether this memory is resolved |
| created_at | timestamptz | Ingestion timestamp |

### incidents

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| type | text | `error`, `network`, or `api` |
| title | text | Auto-generated from first event |
| severity | text | `critical`, `high`, `medium`, `low` |
| status | text | `open`, `investigating`, `resolved` |
| event_count | int | Number of related memories |
| first_seen | timestamptz | When incident first appeared |
| last_seen | timestamptz | Most recent event |
| root_cause | text | User-provided or AI-suggested |
| fix | text | Resolution description |

### alerts

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| incident_id | uuid | FK to incidents |
| memory_id | uuid | FK to memories |
| severity | text | `critical` or `high` |
| title | text | Alert title |
| acknowledged | boolean | Whether user has acknowledged |

### SQL Functions

| Function | Purpose |
|----------|---------|
| `match_memories_hybrid` | Vector + keyword search with combined scoring |
| `find_similar_memory` | Find closest existing memory for clustering |
| `get_incidents` | Aggregated incident list with event counts |

---

## Sponsor Prize Strategy

| Sponsor | Demo Angle | What to Show |
|---------|-----------|--------------|
| **Sentry** | AI error memory | Search `"null pointer"` → get root cause + commit fix + "last happened 2 days ago" |
| **Comcast** | Network intelligence | Search `"bandwidth spike"` → get prediction + pattern: "every Tuesday at 9 PM" |
| **Base44** | Dev infra memory | Search `"schema rollback"` → get "2nd incident this month, add CI schema validation" |

**The pitch:** *"Today Sentry tells you an error happened. We tell you when it happened before, how it was fixed, and which commit resolved it. That's the difference between observability and intelligence."*

---

## Demo Script

1. **Sentry tab** → Search `"null pointer auth"` → Show root cause + fix + commit
2. **Comcast tab** → Search `"bandwidth spike"` → Show pattern detection
3. **Base44 tab** → Search `"schema rollback"` → Show clustering + CI recommendation
4. **Live ingest** → Paste new error → Show it auto-clusters → Alert fires → Query finds it with reasoning
5. **Stream simulator** → Start it, watch incidents cluster in real time

**Key line for judges:** *"We built a system that learns from past incidents, groups them, prioritizes them, and improves over time."*

---

## What Makes This Different

| Tool | What it does | What Memex AI adds |
|------|-------------|-------------------|
| Sentry | Shows you errors | Shows you **when this error happened before and how it was fixed** |
| Datadog | Dashboards and metrics | **Searches by meaning**, not just keywords or filters |
| LogRocket | Session replay | **Clusters related events** into incidents automatically |
| PagerDuty | Alert routing | **AI explains the root cause** and suggests the fix |
| Grep/search | Exact text match | **Semantic search** — finds related issues even with different wording |

---

## License

MIT

---

*Built by Isha for the Sentry × Comcast × Base44 hackathon.*
