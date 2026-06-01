import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBDMidnight } from "@/lib/quota";
import { CATEGORY_QUOTAS } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.post.count({ where }),
    ]);

    // Today's stats
    const todayStart = getBDMidnight();
    const todayPosts = await prisma.post.groupBy({
      by: ["category", "status"],
      where: { createdAt: { gte: todayStart } },
      _count: true,
    });

    const quotas = await prisma.dailyQuota.findMany({
      where: { date: todayStart },
    });

    const stats = {
      today: {
        total: 0,
        published: 0,
        failed: 0,
        pending: 0,
        byCategory: {} as Record<string, { count: number; published: number; target: number }>,
      },
    };

    for (const group of todayPosts) {
      stats.today.total += group._count;
      if (!stats.today.byCategory[group.category]) {
        stats.today.byCategory[group.category] = {
          count: 0,
          published: 0,
          target: CATEGORY_QUOTAS[group.category] || 0,
        };
      }
      stats.today.byCategory[group.category].count += group._count;
      if (group.status === "PUBLISHED") {
        stats.today.published += group._count;
        stats.today.byCategory[group.category].published += group._count;
      } else if (group.status === "FAILED") {
        stats.today.failed += group._count;
      } else {
        stats.today.pending += group._count;
      }
    }

    // Override with actual quota counts
    for (const q of quotas) {
      if (stats.today.byCategory[q.category]) {
        stats.today.byCategory[q.category].published = q.count;
      }
    }

    // Recent workflow runs
    const recentRuns = await prisma.workflowRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      posts,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      stats,
      recentRuns,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
