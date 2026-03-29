import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { ingest } from "@/lib/memory";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { content, metadata = {}, longTerm = true, type = "api" } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    // Use the existing ingest pipeline which handles embedding + clustering
    const result = await ingest({
      type: type as "error" | "network" | "api",
      source: metadata.source || metadata.agent || "openclaw",
      content,
      metadata: {
        ...metadata,
        scope: longTerm ? "long-term" : "session",
        ingested_via: "memory-api",
        severity: metadata.severity || "low",
      },
    });

    return NextResponse.json({
      id: result.id,
      stored: true,
      incident_id: result.incident_id,
      is_new_incident: result.is_new_incident,
    });
  } catch (err: any) {
    console.error("[memory/store] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
