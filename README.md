# 🧠 Memex AI — Incident Intelligence Platform

> **The institutional memory layer for your entire stack.**
> Every error, every fix, every deploy — remembered, connected, and queryable.

**Built for HackPSU 2026 · OpenClaw Track**

Memex AI transforms how engineering teams debug. Instead of digging through logs for 30 minutes hoping to find an answer, you ask a question in plain English and get the root cause, the fix, and which commit introduced the bug — in 2 seconds.

It works by turning every log, error, and event into a **semantic embedding** stored in a vector database. When a new issue comes in, Memex doesn't just match keywords — it understands **meaning**. A search for "auth timeout" finds a past incident titled "NullPointerException in AuthController during token refresh" because they're semantically related, even though they share zero keywords.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [How It Works — The Core Pipeline](#how-it-works--the-core-pipeline)
- [Dashboard Pages](#dashboard-pages)
- [API Reference — Every Endpoint](#api-reference--every-endpoint)
- [OpenClaw Integration](#openclaw-integration--mem0-memory-layer)
- [VS Code Extension](#vs-code-extension)
- [GitHub Actions Integration](#github-actions-integration)
- [Sentry Webhook Integration](#sentry-webhook-integration)
- [Database Schema](#database-schema)
- [Authentication System](#authentication-system)
- [File Structure](#file-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  Dashboard (Next.js)  │  VS Code Extension  │  Any API Client│
│  Clerk-authenticated  │  API key auth       │  API key auth  │
└────────────┬──────────┴──────────┬──────────┴────────┬───────┘
             │                     │                    │
             ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS API LAYER                        │
│                                                              │
│  /api/ingest ──────── Embed + Cluster + Alert                │
│  /api/query ───────── Hybrid Search + AI Reasoning           │
│  /api/memory ──────── OpenClaw-Compatible Memory Tools       │
│  /api/incidents ───── Incident CRUD                          │
│  /api/feedback ────── Reinforcement Learning Loop            │
│  /api/alerts ──────── Alert Management                       │
│  /api/explain ─────── AI Code/Error Explanation              │
│  /api/keys ────────── API Key Generation                     │
│  /api/webhook/github─ CI Failure Ingestion                   │
│  /api/webhook/sentry─ Sentry Issue Ingestion                 │
│  /api/seed ────────── Demo Data Population                   │
│                                                              │
└──────────────┬────────────────────┬──────────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌────────────────────┐
│   OpenAI API         │  │   Supabase         │
│                      │  │                    │
│  text-embedding-     │  │  memories table    │
│  3-small (1536d)     │  │  (pgvector)        │
│                      │  │                    │
│  gpt-4o-mini         │  │  incidents table   │
│  (reasoning)         │  │  alerts table      │
│                      │  │  api_keys table    │
└──────────────────────┘  └────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | Server components, API routes, file-based routing |
| Auth | Clerk | OAuth login, session management, dark theme |
| Database | Supabase (PostgreSQL + pgvector) | Vector similarity search, real-time, managed hosting |
| Embeddings | OpenAI text-embedding-3-small | 1536-dimension vectors, best cost/quality ratio |
| AI Reasoning | OpenAI gpt-4o-mini | Root cause analysis, pattern detection |
| Styling | Tailwind CSS + Custom CSS Variables | Design system with severity colors, animations |
| Deployment | Vercel | Zero-config Next.js hosting |
| VS Code | VS Code Extension API | Editor integration, webview panels |
| CI/CD | GitHub Actions | Automated CI failure reporting |

---

## How It Works — The Core Pipeline

### 1. Ingestion (`/api/ingest` → `lib/memory.ts → ingest()`)

When any event enters the system (error log, network alert, deploy event, VS Code selection, GitHub CI failure, Sentry webhook), the following happens:

1. **Embedding**: The text content is sent to OpenAI's `text-embedding-3-small` model, which converts it into a 1536-dimensional vector that captures its semantic meaning. The word "timeout" and "connection deadline exceeded" end up near each other in vector space even though they share no words.

2. **Deduplication & Clustering**: The embedding is compared against all existing memories using cosine similarity via Supabase's `find_similar_memory` RPC function. If a memory with ≥0.82 similarity already exists AND belongs to an incident, the new memory is added to that same incident cluster. If nothing matches, a new incident is created.

3. **Alert Triggering**: If the metadata contains `severity: "critical"` or `severity: "high"`, an alert is automatically inserted into the `alerts` table. This shows up as a badge count on the Alerts tab in the dashboard.

4. **Storage**: The memory is inserted into the `memories` table with its embedding, metadata, and a link to its incident cluster.

**What goes in**: Raw text + metadata (severity, source, commit hash, service name)
**What comes out**: `{ id, incident_id, is_new_incident, alert_triggered }`

### 2. Querying (`/api/query` → `lib/memory.ts → query()`)

When a user searches (from dashboard, VS Code, or API):

1. **Embedding**: The question is embedded using the same model.

2. **Hybrid Search**: Supabase's `match_memories_hybrid` RPC function runs both:
   - **Vector similarity search**: Finds memories that are semantically close (cosine distance)
   - **Keyword search**: Matches literal text terms

3. **Re-ranking**: Results are re-ranked using three signals:
   - **Similarity score**: Base semantic match (0.0 – 1.0)
   - **Recency boost**: Recent events get a time-decay boost (exponential decay over 168 hours/1 week)
   - **Feedback boost**: Memories previously marked "helpful" get +0.05 per upvote, "not helpful" get -0.05

4. **AI Reasoning**: The top 5 results are sent to GPT-4o-mini with a structured prompt that forces output in this format:
   ```
   **Root Cause:** [1 sentence]
   **Impact:** [1 sentence]
   **Fix:** [1 sentence]
   **Pattern:** [1 sentence about recurrence]
   ```

5. **Pattern Detection**: If multiple results belong to different incident clusters, the system reports the span (e.g., "3 related incidents detected spanning 5 days").

**What goes in**: Natural language question + mode filter
**What comes out**: `{ results[], reasoning, pattern }`

### 3. Feedback Loop (`/api/feedback`)

Users can rate search results as "helpful" (+1), "not_helpful" (-1), or "resolve" (marks the memory as resolved). This feedback directly affects future search rankings through the re-ranking step above. Over time, the system learns which memories are actually useful.

---

## Dashboard Pages

### Landing Page (`/` → `app/page.tsx`)

Public marketing page with:
- Hero section with gradient text and background glow effect
- Animated terminal demo showing a live query → result
- 6 feature cards (Semantic Memory, Incident Clustering, Commit-Linked Debugging, AI Root Cause Analysis, OpenClaw Integration, API-First Platform)
- Before/After comparison (without vs. with Memex)
- Clerk sign-in integration (SignedIn/SignedOut conditional rendering)

### Dashboard Layout (`/dashboard` → `app/dashboard/layout.tsx`)

All dashboard pages share a layout with:
- **Sidebar** (`components/Sidebar.tsx`): Fixed left sidebar (240px) with navigation links (Overview, Memories, Timeline, Integrations, Settings, API Docs), Clerk UserButton for account management, active state highlighting with accent color
- **Content area**: Full-width with sticky headers and backdrop blur

### Overview (`/dashboard` → `app/dashboard/page.tsx`)

The main operational page. Contains 4 sub-views toggled by tabs in the header:

**Query View** (default):
- Search bar with semantic placeholder text
- Mode selector (Errors/Network/Infra) that maps to `sentry`/`comcast`/`base44` types
- Stats bar showing result count, critical count, resolved count, top match %
- AI reasoning card with root cause analysis
- Pattern detection banner
- Expandable memory cards with severity badges, commit links, source tags, similarity scores, feedback buttons (helpful/not helpful/resolve), and full metadata display

**Incidents View**:
- Filter bar (All/Open/Investigating/Resolved)
- Incident cards with status badges, severity indicators, event counts, time-ago timestamps
- Expandable cards showing: Investigate/Resolve/Reopen action buttons, first/last seen timestamps, related events list with content previews

**Ingest View**:
- Source input + severity dropdown (critical/high/medium/low)
- Large textarea for pasting raw error logs, stack traces, network alerts, deploy events
- Submit button that calls `/api/ingest` and shows success/error feedback

**Alerts View**:
- Lists all alerts with severity color-coded left borders
- Acknowledge button per alert
- Badge count in the tab showing unread count

### Memories (`/dashboard/memory` → `app/dashboard/memory/page.tsx`)

Inspired by mem0's OpenMemory dashboard. A table-based memory browser with:

- **Triple filter system**: Type (All/Errors/Network/Infra) + Severity (All/Critical/High/Medium/Low) + Status (All/Active/Resolved)
- **Table header** with column labels: checkbox, Memory, Source, Severity, Status, Age
- **Select-all checkbox** with count display
- **Alternating row colors** (surface/bg-raised)
- **Expandable rows**: Click any row to see full content, all metadata key-value pairs, incident ID link
- **Commit indicators**: Blue commit SHA badges for commit-linked memories
- **Resolved state dimming**: Resolved memories show at 60% opacity

### Timeline (`/dashboard/timeline` → `app/dashboard/timeline/page.tsx`)

The "GitHub for debugging" concept. A vertical commit-linked timeline:

- **Stats bar**: 4 cards showing Total Events, Commit-Linked count, Resolved count, Critical count
- **Type filter**: All/Errors/Network/Infra
- **Date-grouped layout**: Events grouped by day (e.g., "Sat, Mar 29") with event counts
- **Vertical timeline line** with colored dots per severity
- **Event cards** on the timeline showing:
  - Severity + source badges
  - Blue commit SHA badges (linked to the introducing commit)
  - Resolved status indicators
  - Formatted timestamp (Mar 29, 2:30 PM)
- **Expandable blame view** (when a commit exists):
  - Commit SHA with git icon
  - Service name
  - Language badge
  - Full content and metadata

### Integrations (`/dashboard/integrations` → `app/dashboard/integrations/page.tsx`)

Shows all 6 integrations with working connect/disconnect flows:

- **OpenClaw hero card**: Gradient border, feature toggles (Auto-Recall, Auto-Capture, Agent Isolation) with green pulse indicators, configuration table
- **Integration grid** (2-column responsive):
  - Each card shows: icon, name, description, Connected/Connect status
  - Click to expand: capabilities checklist, setup instructions, webhook URLs with copy buttons, curl test commands
  - Connect button marks integration as connected (localStorage-persisted)
  - Disconnect option for non-core integrations
- **Per-integration setup panels**:
  - **OpenClaw**: Configuration values + Memory API endpoint
  - **VS Code**: Settings values (apiUrl, apiKey) + install command
  - **GitHub Actions**: Webhook URL + 3-step setup + copy-paste test curl
  - **Sentry**: Webhook URL + 4-step Sentry internal integration setup
  - **Slack**: Honest note about OAuth requirement + workaround suggestion
  - **REST API**: Base URL + example curl + links to docs/settings

### Settings (`/dashboard/settings` → `app/dashboard/settings/page.tsx`)

API key management and integration setup hub:

- **API Key section**:
  - Shows masked master key from `MEMEX_API_KEY` env var
  - Key generator: enter a name, click Generate, get a `memex_sk_<uuid>` key shown once with copy button
  - Green success card with "save it now" warning
- **Webhook URLs table**: Every endpoint listed with copy buttons:
  - `POST /api/webhook/github` — GitHub Actions failures
  - `POST /api/webhook/sentry` — Sentry issue alerts
  - `POST /api/ingest` — Universal ingest (requires API key)
  - `POST /api/memory` — OpenClaw-compatible memory tools
- **GitHub Actions setup**: Complete `.yml` workflow code block with copy button + 5-step instructions
- **Sentry setup**: 4-step internal integration configuration guide
- **VS Code setup**: 5-step extension configuration guide

### API Docs (`/docs` → `app/docs/page.tsx`)

Full API reference with:
- Left sidebar navigation (scrollspy)
- Sections: Authentication, POST /api/ingest, POST /api/query, Memory Tools, Incidents, Feedback, Alerts, OpenClaw Integration, Integration Examples
- Code blocks with copy-on-hover buttons
- OpenClaw explanation panel (auto-recall, auto-capture, agent isolation, session vs long-term)
- Python SDK example, Node.js example, GitHub Actions YAML

---

## API Reference — Every Endpoint

### `POST /api/ingest` (39 lines)

Stores a memory. Auto-embeds content, clusters into incidents, triggers alerts for high/critical severity.

```json
// Request
{
  "type": "error",                    // "error" | "network" | "api"
  "source": "auth-service",           // originating service name
  "content": "NullPointerException at AuthController.java:142...",
  "metadata": {
    "severity": "critical",           // triggers alert if critical/high
    "title": "NullPointerException in AuthController",
    "commit": "a3f9b2c",             // links to timeline blame view
    "service": "auth-service",
    "language": "Java"
  }
}

// Response
{
  "success": true,
  "id": "memory-uuid",
  "incident_id": "incident-uuid",
  "is_new_incident": false,           // true = new cluster, false = matched existing
  "alert_triggered": true,            // true if severity was critical/high
  "message": "Memory added to existing incident cluster"
}
```

### `POST /api/query` (30 lines)

Hybrid semantic + keyword search with AI reasoning.

```json
// Request
{ "question": "null pointer auth service", "mode": "sentry" }

// Response
{
  "results": [
    {
      "id": "uuid",
      "type": "error",
      "source": "auth-service",
      "content": "NullPointerException at AuthController...",
      "metadata": { "severity": "critical", "commit": "a3f9b2c" },
      "incident_id": "uuid",
      "feedback_score": 2,
      "similarity": 0.94,
      "created_at": "2026-03-22T..."
    }
  ],
  "reasoning": "**Root Cause:** Session expiry during token refresh...",
  "pattern": "2 related incidents detected spanning 3 days"
}
```

Sending an empty `question` with a valid `mode` returns a browse of all memories of that type (most recent first).

### `POST /api/memory` — OpenClaw Dispatcher (251 lines)

Main OpenClaw-compatible endpoint. Routes based on `action` field:

**Search** (`action: "search"`):
```json
{
  "action": "search",
  "query": "database connection pool",
  "scope": "all",        // "error" | "network" | "api" | "all"
  "top_k": 5,
  "threshold": 0.4
}
// Returns: { memories: [{ id, content, score, type, source, categories, metadata }] }
```

Searches all three types (error, network, api) when scope is "all", aggregates and re-ranks by similarity.

**Store** (`action: "store"`):
```json
{
  "action": "store",
  "content": "Auth service crashes when token expires mid-refresh",
  "long_term": true,
  "categories": { "area": "auth" },
  "metadata": { "type": "error", "source": "vscode" }
}
// Returns: { id, event: "ADD"|"UPDATE", message }
```

Deduplication: If content has ≥0.92 cosine similarity to an existing memory, it **updates** that memory instead of creating a duplicate. Returns `event: "UPDATE"` when this happens.

**GET** `/api/memory` — Lists memories with optional type filter and pagination. Also supports `?id=<uuid>` for single memory retrieval.

**DELETE** `/api/memory?id=<uuid>` — Deletes a memory by ID.

### `POST /api/memory/search` (71 lines)

REST-style alternative to the dispatcher. Same semantics as `action: "search"` above.

### `POST /api/memory/store` (39 lines)

REST-style alternative. Uses the core `ingest()` pipeline with OpenClaw metadata tagging.

### `GET /api/memory/list` (50 lines)

Paginated memory listing with `?limit=20&offset=0&type=error` support. Returns `{ memories[], total, limit, offset }`.

### `POST /api/memory/forget` (28 lines)

Deletes a memory by `memory_id`. Returns `{ deleted: true }`.

### `GET /api/incidents` (40 lines)

Lists incident clusters. Supports `?mode=sentry&status=open`. Each incident has `event_count` (number of grouped memories), `first_seen`, `last_seen`, `severity`, `status`.

`?id=<incident-uuid>` returns all memories belonging to that incident.

`PATCH /api/incidents` updates status/root_cause/fix.

### `POST /api/feedback` (31 lines)

```json
{ "memory_id": "uuid", "action": "helpful" }
```
Actions: `helpful` (+1 score), `not_helpful` (-1 score), `resolve` (marks memory as resolved with timestamp).

### `GET /api/alerts` (25 lines)

Lists alerts. `?unread=true` returns only unacknowledged alerts.

`PATCH /api/alerts` with `{ "id": "alert-uuid" }` marks as acknowledged.

### `POST /api/explain` (55 lines)

AI-powered code/error explanation. Used by the VS Code extension.

```json
{
  "code": "java.lang.NullPointerException at AuthController.java:142",
  "filename": "AuthController.java",
  "language": "java",
  "type": "error"        // "error" | "line"
}
// Returns: { explanation: "**What this means:** ..." }
```

For `type: "error"`: Returns What/Why/How to fix/How to prevent.
For `type: "line"`: Returns What this does/How it works/Potential issues/Best practice.

### `POST /api/webhook/github` (82 lines)

Receives GitHub Actions webhook events. Handles two formats:

1. **Native GitHub webhook** (`workflow_run` completed + conclusion=failure): Extracts workflow name, repo, branch, commit SHA, actor, run URL and ingests as a high-severity error memory.

2. **Custom payload** (from a curl step in a workflow): Accepts `{ type, content, severity, title, commit, metadata }` and ingests directly.

No API key required for webhooks (authenticated by webhook secret in production).

### `POST /api/webhook/sentry` (79 lines)

Receives Sentry webhook events. Handles:

1. **Native Sentry issue alert**: Extracts event title, exception values, stack trace frames, platform, environment, release, and ingests with auto-classified severity (fatal→critical, error→high, warning→medium).

2. **Custom payload**: Accepts `{ content, source, severity, title, metadata }` for manual Sentry imports.

### `GET|POST /api/keys` (97 lines)

**GET**: Returns masked master key status + webhook base URL.
**POST**: Generates a new API key in format `memex_sk_<uuid>`. Returns the full key once (never shown again). Falls back to demo mode if `api_keys` table doesn't exist.

### `POST /api/seed` (248 lines)

Populates the database with 15 realistic demo memories across all 3 modes:
- **5 Sentry (error)**: NullPointerException, Stripe timeout, memory leak, rate limit breach, PostgreSQL deadlock
- **5 Comcast (network)**: Bandwidth surge, Chicago latency, DNS cascade, fiber degradation, capacity warning
- **5 Base44 (api)**: Schema rollback, missing index, OOMKilled, API key leak, webhook backlog

Each entry has realistic metadata including commit hashes, severity levels, services, languages, fix descriptions, and resolution status.

---

## OpenClaw Integration — Mem0 Memory Layer

Memex AI integrates with OpenClaw as a memory backend plugin. This means any OpenClaw-compatible AI agent can use Memex as its persistent memory.

### How it works

**Auto-Recall** (before agent responds):
The OpenClaw plugin calls `POST /api/memory` with `action: "search"` using the user's latest message as the query. Relevant memories are injected into the agent's context window before it generates a response. This means the agent "remembers" past errors, fixes, and patterns.

**Auto-Capture** (after agent responds):
After the agent responds, the plugin filters the conversation through a noise-removal pipeline, then calls `POST /api/memory` with `action: "store"` to save key facts. Deduplication ensures near-identical content (≥0.92 similarity) updates existing memories instead of creating duplicates.

**Memory Scopes**:
- **Session (short-term)**: Memories scoped to the current conversation via `run_id`
- **User (long-term)**: Memories that persist across all sessions (default)

**Agent Isolation**:
In multi-agent setups, session keys following `agent:<id>:<uuid>` patterns automatically namespace memories. Different agents never see each other's memories unless explicitly queried with `agentId`.

### Available OpenClaw Tools

| Tool | Endpoint | Description |
|------|----------|-------------|
| `memory_search` | `POST /api/memory` (action: search) | Semantic search with scope control |
| `memory_store` | `POST /api/memory` (action: store) | Store with auto-deduplication |
| `memory_list` | `GET /api/memory` | Browse with pagination |
| `memory_get` | `GET /api/memory?id=<uuid>` | Retrieve by ID |
| `memory_forget` | `DELETE /api/memory?id=<uuid>` | Remove outdated memories |

### Plugin Configuration

```json
{
  "id": "openclaw-mem0",
  "name": "Memory (Mem0)",
  "config": {
    "mode": "platform",
    "userId": "your-user-id",
    "autoRecall": true,
    "autoCapture": true,
    "searchThreshold": 0.4,
    "topK": 5,
    "enableGraph": false
  }
}
```

---

## VS Code Extension

Located in `memex-vscode/` — a complete VS Code extension (v0.2.0) that connects to the Memex AI backend.

### Features

| Command | Shortcut | What it does |
|---------|----------|-------------|
| Search Selected Text | `Ctrl+Shift+M` | Selects text → calls `/api/query` → shows results in sidebar panel with severity badges, match scores, and feedback buttons |
| Search Memory (prompt) | `Ctrl+Shift+Alt+M` | Opens input box → searches memory |
| Ingest Selected Text | Right-click menu | Prompts for severity + source → calls `/api/ingest` → stores in memory |
| Ingest Current File | Command palette | Ingests entire file content as a memory |
| Explain This Error | `Ctrl+Shift+E` | Calls `/api/explain` (type: error) → opens markdown doc in split pane with root cause + fix + also searches memory for similar past incidents |
| Explain This Line | Right-click menu | Calls `/api/explain` (type: line) → opens explanation in split pane |
| Open Panel | Command palette | Focuses the Memex AI sidebar panel |

### Activity Bar Panel

The extension registers a webview panel in VS Code's activity bar (left sidebar) with:
- Search bar with Enter-to-search
- Loading animation (pulsing dots)
- Results display with severity badges, source tags, similarity percentages
- Expandable cards showing full content
- Feedback buttons (👍/👎) that call `/api/feedback`
- Pattern detection banner
- AI reasoning display

### Auto-Ingest Terminal Errors

When `memex.autoIngestErrors` is enabled, the extension monitors terminal output for patterns matching:
```
Error: | Exception | FATAL | panic: | Traceback | ECONNREFUSED | OOMKilled
```
Matching output (>20 chars) is automatically ingested as a medium-severity memory from source "terminal-auto".

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `memex.apiUrl` | `http://localhost:3000` | Your Memex AI server URL |
| `memex.apiKey` | (empty) | API key from Settings page |
| `memex.defaultMode` | `sentry` | Default search mode (`sentry`/`comcast`/`base44`) |
| `memex.autoIngestErrors` | `false` | Auto-capture terminal errors |

### How It Connects

The extension makes standard `fetch()` calls to your Memex API:
```
VS Code Extension  →  fetch("http://localhost:3002/api/query")
                       Header: x-api-key: memex_api_key_sample_2026
                       Body: { question: "selected text", mode: "sentry" }
                   ←  { results, reasoning, pattern }
```

No OAuth. No login popup. Just an API key in VS Code settings.

---

## GitHub Actions Integration

### How it works

A GitHub Actions workflow (`.github/workflows/memex-reporter.yml`) triggers whenever **any** workflow in the repo completes with a failure:

1. GitHub fires `workflow_run` event with `conclusion: "failure"`
2. The reporter job runs and sends a `curl` POST to your Memex webhook
3. The webhook endpoint (`/api/webhook/github`) ingests the failure with:
   - Commit SHA linked to the event
   - Branch name, repo name, actor, run URL in metadata
   - Severity: high (auto-triggers alert)
4. The memory appears in your dashboard, timeline, and is searchable

### Setup

1. Go to your repo → Settings → Secrets and Variables → Actions
2. Add `MEMEX_URL` = your deployed Memex URL (e.g., `https://memex-ai.vercel.app`)
3. Add `MEMEX_API_KEY` = your API key
4. Copy `.github/workflows/memex-reporter.yml` to your repo
5. Push — next CI failure will auto-report

### Webhook Payload (custom)

You can also send custom payloads from any workflow step:

```yaml
- name: Report to Memex
  if: failure()
  run: |
    curl -X POST ${{ secrets.MEMEX_URL }}/api/webhook/github \
      -H "Content-Type: application/json" \
      -d '{
        "type": "error",
        "source": "github-actions",
        "content": "Build failed: missing dependency xyz",
        "severity": "high",
        "commit": "${{ github.sha }}"
      }'
```

---

## Sentry Webhook Integration

### How it works

Sentry sends issue alert webhooks to `/api/webhook/sentry`. The endpoint parses:
- Event title and exception values
- Stack trace frames (last 3 frames)
- Platform, environment, release
- Severity auto-classification: `fatal` → critical, `error` → high, `warning` → medium

### Setup

1. In Sentry → Settings → Integrations → Internal Integrations
2. Create new integration, set webhook URL to: `https://your-app.vercel.app/api/webhook/sentry`
3. Subscribe to `issue` events
4. Create an alert rule that sends to this webhook on new issues

---

## Database Schema

Run `supabase-setup.sql` in the Supabase SQL Editor. Creates:

### `memories` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `type` | text | `"error"` \| `"network"` \| `"api"` |
| `source` | text | Originating service/node |
| `content` | text | Full text of the log/event |
| `metadata` | jsonb | Structured data (severity, commit, title, etc.) |
| `embedding` | vector(1536) | OpenAI embedding for semantic search |
| `incident_id` | uuid | Links to parent incident cluster |
| `feedback_score` | integer | Accumulated helpful/not_helpful votes |
| `resolved` | boolean | Whether this memory has been resolved |
| `resolved_at` | timestamptz | When it was resolved |
| `resolved_by` | text | Who resolved it |
| `created_at` | timestamptz | Insertion timestamp |

### `incidents` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Cluster identifier |
| `type` | text | Same as memories type |
| `title` | text | First event title or auto-generated |
| `severity` | text | Highest severity in cluster |
| `status` | text | `"open"` \| `"investigating"` \| `"resolved"` |
| `first_seen` | timestamptz | Earliest event in cluster |
| `last_seen` | timestamptz | Most recent event in cluster |
| `root_cause` | text | User-provided root cause |
| `fix` | text | User-provided fix description |
| `metadata` | jsonb | Cluster metadata |

### `alerts` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Alert identifier |
| `incident_id` | uuid | Related incident |
| `memory_id` | uuid | Triggering memory |
| `severity` | text | `"critical"` \| `"high"` |
| `title` | text | Alert title |
| `message` | text | Alert description |
| `acknowledged` | boolean | Whether acknowledged |
| `created_at` | timestamptz | Alert timestamp |

### RPC Functions

- `find_similar_memory(query_embedding, similarity_threshold, filter_type)` — Vector similarity search with type filter, 0.82 threshold for clustering
- `match_memories_hybrid(query_embedding, query_text, match_threshold, match_count, filter_type)` — Combined vector + text search for queries
- `get_incidents(filter_type, filter_status, result_limit)` — Aggregated incident listing with event counts

### Indexes

- `memories_embedding_idx` — IVFFlat index on embedding column with 100 lists for fast approximate nearest neighbor search

---

## Authentication System

### How it works (`lib/api-auth.ts`)

Every API route calls `validateApiKey(req)` which has a 3-tier auth model:

1. **Dashboard bypass**: If the request's `origin` or `referer` header matches the `host` header (same-origin), OR if origin is empty (server-side calls), the request passes with `userId: "dashboard"`. This lets the Next.js frontend call its own API routes without an API key.

2. **Master key**: If the `x-api-key` header (or `Authorization: Bearer <key>`) matches the `MEMEX_API_KEY` environment variable, the request passes with `userId: "api-master"`. This is what the VS Code extension and external clients use.

3. **Rejection**: All other requests get a 401 (no key) or 403 (invalid key).

### Clerk Integration

Clerk handles user authentication for the dashboard:
- `middleware.ts` protects `/dashboard(.*)` routes — unauthenticated users are redirected to sign-in
- `ClerkProvider` wraps the app with dark theme
- `UserButton` in the sidebar shows avatar + account management
- `SignInButton` / `SignedIn` / `SignedOut` on the landing page

---

## File Structure

```
memex-ai-enhanced/
├── .github/
│   └── workflows/
│       └── memex-reporter.yml          # GitHub Actions CI failure reporter
├── app/
│   ├── api/
│   │   ├── alerts/route.ts             # GET/PATCH alert management
│   │   ├── explain/route.ts            # POST AI code/error explanation
│   │   ├── feedback/route.ts           # POST upvote/downvote/resolve
│   │   ├── incidents/route.ts          # GET/PATCH incident CRUD
│   │   ├── ingest/route.ts             # POST memory ingestion pipeline
│   │   ├── keys/route.ts               # GET/POST API key management
│   │   ├── memory/
│   │   │   ├── route.ts                # OpenClaw dispatcher (search/store/list/delete)
│   │   │   ├── search/route.ts         # REST-style memory search
│   │   │   ├── store/route.ts          # REST-style memory store
│   │   │   ├── list/route.ts           # REST-style memory list
│   │   │   └── forget/route.ts         # REST-style memory delete
│   │   ├── query/route.ts              # POST hybrid search + AI reasoning
│   │   ├── seed/route.ts               # POST demo data population (15 entries)
│   │   └── webhook/
│   │       ├── github/route.ts         # GitHub Actions failure webhook
│   │       └── sentry/route.ts         # Sentry issue alert webhook
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar + content layout
│   │   ├── page.tsx                    # Overview (search/incidents/ingest/alerts)
│   │   ├── memory/page.tsx             # Memory table browser with filters
│   │   ├── timeline/page.tsx           # Commit-linked debug timeline
│   │   ├── integrations/page.tsx       # Integration cards with connect flows
│   │   └── settings/page.tsx           # API keys, webhooks, setup guides
│   ├── docs/page.tsx                   # Full API reference documentation
│   ├── layout.tsx                      # Root layout (Clerk, fonts, metadata)
│   ├── page.tsx                        # Landing page
│   └── globals.css                     # Design system (CSS variables, animations)
├── components/
│   └── Sidebar.tsx                     # Dashboard navigation sidebar
├── lib/
│   ├── api-auth.ts                     # API key validation (3-tier auth)
│   ├── memory.ts                       # Core engine (embed, ingest, query, browse, etc.)
│   ├── openai.ts                       # OpenAI client initialization
│   └── supabase.ts                     # Supabase client initialization
├── memex-vscode/
│   ├── src/extension.js                # VS Code extension (282 lines)
│   ├── media/icon.png                  # Extension icon
│   ├── package.json                    # Extension manifest (commands, keybindings, config)
│   └── README.md                       # Extension documentation
├── types/index.ts                      # TypeScript type definitions
├── middleware.ts                        # Clerk route protection
├── supabase-setup.sql                  # Database schema + RPC functions
├── tailwind.config.ts                  # Tailwind theme (colors, fonts, animations)
├── package.json                        # Next.js dependencies
└── README.md                           # This file
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key
- Clerk account (free tier works)

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd memex-ai-enhanced
npm install

# 2. Create .env.local with your keys (see Environment Variables below)

# 3. Set up Supabase
#    - Create a new project
#    - Go to SQL Editor
#    - Paste and run supabase-setup.sql
#    - Copy your project URL and service role key

# 4. Start dev server
npm run dev -p 3002

# 5. Seed demo data (run once)
curl -X POST http://localhost:3002/api/seed

# 6. Open http://localhost:3002
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenAI
OPENAI_API_KEY=sk-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Memex API Key (used by VS Code extension + external clients)
MEMEX_API_KEY=memex_api_key_sample_2026
```

The `MEMEX_API_KEY` value must match what you set in your VS Code extension settings (`memex.apiKey`). It can be any string — this is what `lib/api-auth.ts` checks against.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables from `.env.local` to Vercel's Environment Variables
4. Deploy

Your production URL becomes the `memex.apiUrl` for VS Code and the `MEMEX_URL` for GitHub Actions secrets.

### After deployment

1. Update VS Code extension `memex.apiUrl` to your Vercel URL
2. Add `MEMEX_URL` and `MEMEX_API_KEY` as GitHub repo secrets
3. Set Sentry webhook URL to `https://your-app.vercel.app/api/webhook/sentry`

---

## What Makes This Different

Traditional observability tools (Sentry, Datadog, PagerDuty) are **stateless**. They alert you when something breaks, but they don't remember how it was fixed. Next sprint, when the same class of error happens again, you start from scratch.

Memex AI is **stateful**. It remembers every incident, every fix, every commit that introduced a bug. When something breaks, it doesn't just alert you — it tells you:

- This happened before (pattern detection)
- Here's what caused it last time (root cause analysis)
- Here's the commit that introduced it (blame view)
- Here's how it was fixed (resolution history)
- Here's who to ask (source attribution)

It's not replacing Sentry — it's the **memory layer on top of everything**.

---

**Built by Isha & Sudarshan · HackPSU 2026 · OpenClaw Track**
