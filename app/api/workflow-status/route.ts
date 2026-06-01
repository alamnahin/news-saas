import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllDailyQuotas } from "@/lib/quota";

export async function GET() {
  try {
    const [latestRun, quotas, errorLogs] = await Promise.all([
      prisma.workflowRun.findFirst({ orderBy: { startedAt: "desc" } }),
      getAllDailyQuotas(),
      prisma.errorLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({ latestRun, quotas, errorLogs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
