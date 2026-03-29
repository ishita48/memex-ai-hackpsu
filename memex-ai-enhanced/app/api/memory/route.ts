import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";
import { validateApiKey } from "@/lib/api-auth";

// ─── EMBED ─────────────────────────────────────────────────────
async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// ─── POST /api/memory — route dispatcher ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { action } = body;

    if (action === "search") {
      return handleSearch(body);
    } else if (action === "store") {
      return handleStore(body);
    } else {
      return NextResponse.json(
        { error: "action must be 'search' or 'store'" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("[memory] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── GET /api/memory — list memories ───────────────────────────
export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(parseInt(searchParams.get("page_size") || "20"), 100);
    const scope = searchParams.get("scope") || "all";
    const id = searchParams.get("id");

    // Get specific memory
    if (id) {
      const { data, error } = await supabase
        .from("memories")
        .select("id, type, source, content, metadata, incident_id, feedback_score, resolved, created_at")
        .eq("id", id)
        .single();

      if (error) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

      return NextResponse.json({
        id: data.id,
        content: data.content,
        type: data.type,
        source: data.source,
        categories: extractCategories(data.metadata),
        metadata: data.metadata,
        incident_id: data.incident_id,
        feedback_score: data.feedback_score,
        resolved: data.resolved,
        created_at: data.created_at,
      });
    }

    // List memories
    let query = supabase
      .from("memories")
      .select("id, type, source, content, metadata, incident_id, feedback_score, resolved, created_at")
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (scope === "error") query = query.eq("type", "error");
    else if (scope === "network") query = query.eq("type", "network");
    else if (scope === "api") query = query.eq("type", "api");

    const { data, error } = await query;
    if (error) throw new Error(`List failed: ${error.message}`);

    const memories = (data || []).map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      source: m.source,
      categories: extractCategories(m.metadata),
      metadata: m.metadata,
      created_at: m.created_at,
    }));

    return NextResponse.json({ memories, total: memories.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/memory — forget a memory ──────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── SEARCH ────────────────────────────────────────────────────
async function handleSearch(body: any) {
  const { query: searchQuery, scope = "all", top_k = 5, threshold = 0.4 } = body;

  if (!searchQuery) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const queryEmbedding = await embed(searchQuery);

  // Use existing RPC function for semantic search
  const filterType = scope === "error" ? "error" : scope === "network" ? "network" : scope === "api" ? "api" : null;

  let results;
  if (filterType) {
    const { data, error } = await supabase.rpc("find_similar_memory", {
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      filter_type: filterType,
    });
    if (error) throw new Error(`Search failed: ${error.message}`);
    results = data;
  } else {
    // Search all types using match_memories_hybrid
    const allResults = [];
    for (const type of ["error", "network", "api"]) {
      const { data } = await supabase.rpc("match_memories_hybrid", {
        query_embedding: queryEmbedding,
        query_text: searchQuery,
        match_threshold: threshold,
        match_count: top_k,
        filter_type: type,
      });
      if (data) allResults.push(...data);
    }
    results = allResults
      .sort((a: any, b: any) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, top_k);
  }

  const memories = (results || []).map((m: any) => ({
    id: m.id,
    content: m.content,
    score: m.similarity,
    type: m.type,
    source: m.source,
    categories: extractCategories(m.metadata),
    metadata: m.metadata,
    created_at: m.created_at,
  }));

  return NextResponse.json({ memories });
}

// ─── STORE ─────────────────────────────────────────────────────
async function handleStore(body: any) {
  const { content, long_term = true, categories = {}, metadata = {} } = body;

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const embedding = await embed(content);

  // Check for duplicates
  const { data: similar } = await supabase.rpc("find_similar_memory", {
    query_embedding: embedding,
    similarity_threshold: 0.92,
    filter_type: metadata.type || "error",
  });

  if (similar && similar.length > 0) {
    // Update existing memory
    const existing = similar[0];
    const { error } = await supabase
      .from("memories")
      .update({
        content,
        metadata: { ...existing.metadata, ...metadata, ...categories, updated_at: new Date().toISOString() },
        embedding,
      })
      .eq("id", existing.id);

    if (error) throw new Error(`Update failed: ${error.message}`);

    return NextResponse.json({
      id: existing.id,
      event: "UPDATE",
      message: "Existing memory updated (duplicate detected)",
    });
  }

  // Insert new memory
  const { data, error } = await supabase
    .from("memories")
    .insert({
      type: metadata.type || "error",
      source: metadata.source || "openclaw",
      content,
      metadata: { ...metadata, ...categories, long_term, ingested_via: "openclaw-memory-api" },
      embedding,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Store failed: ${error.message}`);

  return NextResponse.json({
    id: data.id,
    event: "ADD",
    message: "Memory stored successfully",
  });
}

// ─── HELPERS ───────────────────────────────────────────────────
function extractCategories(metadata: any): string[] {
  if (!metadata) return [];
  const cats: string[] = [];
  if (metadata.severity) cats.push(metadata.severity);
  if (metadata.service) cats.push(metadata.service);
  if (metadata.language) cats.push(metadata.language);
  if (metadata.type) cats.push(metadata.type);
  return cats;
}
