import { NextRequest, NextResponse } from "next/server";
import { ingest } from "@/lib/memory";

// POST /api/webhook/sentry — receive Sentry webhook alerts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle Sentry issue alert
    if (body.event || body.data?.event) {
      const event = body.event || body.data?.event;
      const issue = body.data?.issue;

      const content = [
        event.title || issue?.title || "Sentry Error",
        event.message || "",
        event.culprit ? `Culprit: ${event.culprit}` : "",
        event.exception?.values?.[0]?.value || "",
        event.exception?.values?.[0]?.stacktrace?.frames
          ?.slice(-3)
          .map((f: any) => `  at ${f.function || "?"} (${f.filename}:${f.lineno})`)
          .join("\n") || "",
      ]
        .filter(Boolean)
        .join("\n");

      const severity = event.level === "fatal" || event.level === "error"
        ? (event.tags?.find((t: any) => t.key === "level")?.value === "fatal" ? "critical" : "high")
        : "medium";

      const result = await ingest({
        type: "error",
        source: "sentry",
        content,
        metadata: {
          severity,
          title: event.title || issue?.title || "Sentry Error",
          service: event.project || issue?.project?.slug || "unknown",
          sentry_event_id: event.event_id,
          sentry_issue_id: issue?.id,
          platform: event.platform,
          environment: event.environment || "production",
          release: event.release,
          status: "new",
          ingested_via: "sentry-webhook",
        },
      });

      return NextResponse.json({
        success: true,
        ...result,
        message: "Sentry issue ingested as memory",
      });
    }

    // Handle manual payload (API key based Sentry import)
    if (body.content) {
      const result = await ingest({
        type: "error",
        source: body.source || "sentry",
        content: body.content,
        metadata: {
          severity: body.severity || "high",
          title: body.title || body.content.slice(0, 80),
          status: "new",
          ingested_via: "sentry-webhook",
          ...body.metadata,
        },
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ received: true, message: "No actionable event" });
  } catch (err: any) {
    console.error("[webhook/sentry] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
