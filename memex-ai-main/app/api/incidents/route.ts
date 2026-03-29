import { NextRequest, NextResponse } from "next/server";
import {
  getIncidents,
  getIncidentMemories,
  updateIncidentStatus,
} from "@/lib/memory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "sentry";
    const status = searchParams.get("status") || undefined;
    const incidentId = searchParams.get("id");

    if (incidentId) {
      const memories = await getIncidentMemories(incidentId);
      return NextResponse.json({ memories });
    }

    const incidents = await getIncidents(mode, status);
    return NextResponse.json({ incidents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, root_cause, fix } = await req.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      );
    }
    await updateIncidentStatus(id, status, root_cause, fix);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}