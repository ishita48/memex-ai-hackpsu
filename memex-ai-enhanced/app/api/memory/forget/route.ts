import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiKey(req);
    if (auth.error) return auth.error;

    const { memory_id } = await req.json();

    if (!memory_id) {
      return NextResponse.json({ error: "memory_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memory_id);

    if (error) throw new Error(`Delete failed: ${error.message}`);

    return NextResponse.json({ deleted: true, memory_id });
  } catch (err: any) {
    console.error("[memory/forget] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
