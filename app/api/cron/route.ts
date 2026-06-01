import { NextRequest, NextResponse } from "next/server";
import { runWorkflow } from "@/lib/workflow";

export const maxDuration = 300; // 5 minutes

export async function GET(req: NextRequest) {
  // Verify cron secret from Vercel
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting scheduled workflow run...");
    const result = await runWorkflow("cron");
    console.log("[Cron] Workflow completed:", result);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[Cron] Workflow failed:", err);
    return NextResponse.json(
      { error: "Workflow failed", details: String(err) },
      { status: 500 }
    );
  }
}
