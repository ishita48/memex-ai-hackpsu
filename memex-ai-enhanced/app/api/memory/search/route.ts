import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { query, scope = "all", top_k = 5, threshold = 0.4 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Generate embedding for the query
    const embResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = embResponse.data[0].embedding;

    // Search across all types (OpenClaw doesn't use mode-based filtering)
    const { data: results, error } = await supabase.rpc("find_similar_memory", {
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      filter_type: null, // search all types
    });

    if (error) {
      // Fallback: try without type filter using match_memories_hybrid
      const { data: fallback, error: fbErr } = await supabase.rpc("match_memories_hybrid", {
        query_embedding: queryEmbedding,
        query_text: query,
        match_threshold: threshold,
        match_count: top_k,
        filter_type: "error", // default fallback
      });

      if (fbErr) throw new Error(`Search failed: ${fbErr.message}`);

      return NextResponse.json({
        results: (fallback || []).slice(0, top_k).map((r: any) => ({
          id: r.id,
          content: r.content,
          score: r.similarity,
          metadata: r.metadata,
          source: r.source,
          type: r.type,
          created_at: r.created_at,
        })),
      });
    }

    return NextResponse.json({
      results: (results || []).slice(0, top_k).map((r: any) => ({
        id: r.id,
        content: r.content,
        score: r.similarity,
        metadata: r.metadata,
        source: r.source,
        type: r.type,
        created_at: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error("[memory/search] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
