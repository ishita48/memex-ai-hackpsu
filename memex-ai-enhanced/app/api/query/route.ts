import { NextRequest, NextResponse } from "next/server";
import { query, browse } from "@/lib/memory";
import { validateApiKey } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { question, mode } = body;

    if (!mode || !["sentry", "comcast", "base44"].includes(mode)) {
      return NextResponse.json(
        { error: "mode must be 'sentry', 'comcast', or 'base44'" },
        { status: 400 }
      );
    }

    if (!question || !question.trim()) {
      const results = await browse(mode);
      return NextResponse.json({ results, reasoning: null });
    }

    const result = await query(question, mode);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[query] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}