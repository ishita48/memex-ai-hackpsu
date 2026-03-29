import { NextRequest, NextResponse } from "next/server";
import { getAlerts, acknowledgeAlert } from "@/lib/memory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unread = searchParams.get("unread") === "true";
    const alerts = await getAlerts(unread ? false : undefined);
    return NextResponse.json({ alerts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await acknowledgeAlert(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}