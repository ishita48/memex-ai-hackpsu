import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // optional filter

    let query = supabase
      .from("memories")
      .select("id, type, source, content, metadata, incident_id, feedback_score, resolved, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`List failed: ${error.message}`);

    return NextResponse.json({
      memories: (data || []).map((m: any) => ({
        id: m.id,
        content: m.content,
        memory: m.content, // OpenClaw compat alias
        source: m.source,
        type: m.type,
        metadata: m.metadata,
        categories: m.metadata?.categories || [],
        state: m.resolved ? "resolved" : "active",
        feedback_score: m.feedback_score,
        created_at: m.created_at,
      })),
      total: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("[memory/list] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
