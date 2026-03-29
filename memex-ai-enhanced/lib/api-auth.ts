import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabase";

export async function validateApiKey(
  req: NextRequest
): Promise<{ userId?: string; error?: NextResponse }> {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const host = req.headers.get("host") || "";

  // Dashboard requests bypass auth
  if (origin.includes(host) || referer.includes(host) || origin === "") {
    return { userId: "dashboard" };
  }

  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    "";

  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: "API key required. Pass via x-api-key header." },
        { status: 401 }
      ),
    };
  }

  const masterKey = process.env.MEMEX_API_KEY;
  if (masterKey && apiKey === masterKey) {
    return { userId: "api-master" };
  }

  return {
    error: NextResponse.json({ error: "Invalid API key" }, { status: 403 }),
  };
}
