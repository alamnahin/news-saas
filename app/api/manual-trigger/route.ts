import { NextResponse } from "next/server";
import { runWorkflow } from "@/lib/workflow";

export const maxDuration = 300;

export async function POST() {
  try {
    console.log("[Manual] Starting manually triggered workflow...");
    const result = await runWorkflow("manual");
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[Manual] Workflow failed:", err);
    return NextResponse.json(
      { error: "Workflow failed", details: String(err) },
      { status: 500 }
    );
  }
}
