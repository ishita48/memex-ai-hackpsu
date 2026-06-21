import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { randomUUID, createHash } from "crypto";

// GET /api/keys — list all API keys for the user
export async function GET(req: NextRequest) {
  try {
    const masterKey = process.env.MEMEX_API_KEY || "";
    const maskedMaster = masterKey
      ? masterKey.slice(0, 8) + "•".repeat(Math.max(0, masterKey.length - 12)) + masterKey.slice(-4)
      : "Not configured";

    const { data: keys } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used, is_active")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      master_key: {
        masked: maskedMaster,
        exists: !!masterKey,
      },
      keys: keys || [],
      webhook_url: getWebhookUrl(), // ✅ FIXED
    });
  } catch {
    const masterKey = process.env.MEMEX_API_KEY || "";
    return NextResponse.json({
      master_key: {
        masked: masterKey
          ? masterKey.slice(0, 8) + "•".repeat(Math.max(0, masterKey.length - 12)) + masterKey.slice(-4)
          : "Not configured",
        exists: !!masterKey,
      },
      keys: [],
      webhook_url: getWebhookUrl(), // ✅ FIXED
    });
  }
}

// POST /api/keys — generate a new API key
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const keyName = name || "Untitled Key";

    const rawKey = `memex_sk_${randomUUID().replace(/-/g, "")}`;
    const keyPrefix = rawKey.slice(0, 14);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    try {
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          name: keyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          is_active: true,
        })
        .select("id, name, key_prefix, created_at")
        .single();

      if (error) throw error;

      return NextResponse.json({
        id: data.id,
        name: data.name,
        key: rawKey,
        key_prefix: keyPrefix,
        created_at: data.created_at,
        message: "Save this key — it won't be shown again.",
      });
    } catch {
      return NextResponse.json({
        id: randomUUID(),
        name: keyName,
        key: rawKey,
        key_prefix: keyPrefix,
        created_at: new Date().toISOString(),
        message: "Key generated (demo mode — api_keys table not found). Use MEMEX_API_KEY env var for production.",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ FIXED FUNCTION (NO req, NO mismatch)
function getWebhookUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";
}