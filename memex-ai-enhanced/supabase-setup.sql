-- ╔══════════════════════════════════════════════════════════════╗
-- ║  MEMEX AI — Supabase Setup Script                          ║
-- ║  Run this in Supabase SQL Editor (Dashboard → SQL Editor)  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create memories table
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  type text not null,           -- 'error' | 'network' | 'api'
  source text not null,         -- service/node that generated it
  content text not null,        -- full text of the log/event
  metadata jsonb default '{}',  -- structured data (severity, commit, etc.)
  embedding vector(1536),       -- OpenAI text-embedding-3-small output
  created_at timestamptz default now()
);

-- 3. Create index for fast vector search
create index if not exists memories_embedding_idx
  on memories
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Create the semantic search function
create or replace function match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_type text
)
returns table (
  id uuid,
  type text,
  source text,
  content text,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.type,
    m.source,
    m.content,
    m.metadata,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from memories m
  where m.type = filter_type
    and 1 - (m.embedding <=> query_embedding) > match_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

-- 5. (Optional) Row Level Security — uncomment if using Clerk user IDs
-- alter table memories enable row level security;
-- alter table memories add column user_id text;
-- create policy "Users can read own memories"
--   on memories for select
--   using (user_id = current_setting('request.jwt.claims')::json->>'sub');
