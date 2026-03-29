import { NextRequest, NextResponse } from "next/server";
import { submitFeedback, resolveMemory } from "@/lib/memory";

export async function POST(req: NextRequest) {
  try {
    const { memory_id, action } = await req.json();

    if (!memory_id || !action) {
      return NextResponse.json(
        { error: "memory_id and action required" },
        { status: 400 }
      );
    }

    if (action === "helpful") {
      await submitFeedback(memory_id, 1);
    } else if (action === "not_helpful") {
      await submitFeedback(memory_id, -1);
    } else if (action === "resolve") {
      await resolveMemory(memory_id);
    } else {
      return NextResponse.json(
        { error: "action must be 'helpful', 'not_helpful', or 'resolve'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}