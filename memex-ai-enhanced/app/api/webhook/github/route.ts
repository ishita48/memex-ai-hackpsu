import { NextRequest, NextResponse } from "next/server";
import { ingest } from "@/lib/memory";

// POST /api/webhook/github — receive GitHub Actions webhook
// This endpoint accepts GitHub workflow failure reports
// No API key needed for webhooks — authenticated via webhook secret or just open for hackathon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle GitHub Actions workflow_run event
    if (body.action === "completed" && body.workflow_run?.conclusion === "failure") {
      const run = body.workflow_run;
      const content = [
        `GitHub Actions workflow failed: ${run.name}`,
        `Repository: ${run.repository?.full_name || "unknown"}`,
        `Branch: ${run.head_branch || "unknown"}`,
        `Commit: ${run.head_sha?.slice(0, 7) || "unknown"}`,
        `Commit message: ${run.head_commit?.message || "N/A"}`,
        `Run URL: ${run.html_url || "N/A"}`,
        `Triggered by: ${run.actor?.login || "unknown"}`,
      ].join("\n");

      const result = await ingest({
        type: "error",
        source: "github-actions",
        content,
        metadata: {
          severity: "high",
          title: `CI Failed: ${run.name} on ${run.head_branch}`,
          commit: run.head_sha?.slice(0, 7),
          service: run.repository?.name || "unknown",
          repo: run.repository?.full_name,
          branch: run.head_branch,
          run_url: run.html_url,
          actor: run.actor?.login,
          status: "new",
          ingested_via: "github-webhook",
        },
      });

      return NextResponse.json({
        success: true,
        ...result,
        message: "CI failure ingested as memory",
      });
    }

    // Handle manual/custom payload from GitHub Actions step
    if (body.type && body.content) {
      const result = await ingest({
        type: body.type || "error",
        source: body.source || "github-actions",
        content: body.content,
        metadata: {
          severity: body.severity || body.metadata?.severity || "high",
          title: body.title || body.metadata?.title || body.content.slice(0, 80),
          commit: body.commit || body.metadata?.commit,
          service: body.service || body.metadata?.service,
          status: "new",
          ingested_via: "github-webhook",
          ...body.metadata,
        },
      });

      return NextResponse.json({
        success: true,
        ...result,
        message: "Event ingested via GitHub webhook",
      });
    }

    // Unknown payload — log it but don't error
    return NextResponse.json({
      received: true,
      message: "Webhook received but no actionable event detected",
    });
  } catch (err: any) {
    console.error("[webhook/github] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
