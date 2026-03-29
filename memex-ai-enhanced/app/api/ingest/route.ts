import { NextRequest, NextResponse } from "next/server";
import { ingest } from "@/lib/memory";
import { validateApiKey } from "@/lib/api-auth";
import type { IngestPayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const body: IngestPayload = await req.json();

    if (!body.type || !body.source || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: type, source, content" },
        { status: 400 }
      );
    }

    if (!["error", "network", "api"].includes(body.type)) {
      return NextResponse.json(
        { error: "type must be 'error', 'network', or 'api'" },
        { status: 400 }
      );
    }

    const result = await ingest(body);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.is_new_incident
        ? "New incident created and memory stored"
        : "Memory added to existing incident cluster",
    });
  } catch (err: any) {
    console.error("[ingest] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}