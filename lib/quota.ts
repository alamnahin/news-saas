import { prisma } from "./prisma";
import { CATEGORY_QUOTAS } from "@/types";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const BD_TIMEZONE = "Asia/Dhaka";

export function getBDMidnight(): Date {
  const now = new Date();
  const bdNow = toZonedTime(now, BD_TIMEZONE);
  const bdMidnight = startOfDay(bdNow);
  // Convert back to UTC for storage
  return new Date(
    Date.UTC(
      bdMidnight.getFullYear(),
      bdMidnight.getMonth(),
      bdMidnight.getDate(),
      0, 0, 0, 0
    ) - 6 * 60 * 60 * 1000 // UTC+6
  );
}

export async function getDailyQuotas(): Promise<Record<string, number>> {
  const date = getBDMidnight();
  const quotas = await prisma.dailyQuota.findMany({
    where: { date },
  });
  const result: Record<string, number> = {};
  for (const q of quotas) {
    result[q.category] = q.count;
  }
  return result;
}

export async function incrementQuota(category: string): Promise<void> {
  const date = getBDMidnight();
  await prisma.dailyQuota.upsert({
    where: { date_category: { date, category } },
    update: { count: { increment: 1 } },
    create: { date, category, count: 1 },
  });
}

export async function isCategoryQuotaReached(
  category: string,
  currentCounts: Record<string, number>
): Promise<boolean> {
  const quota = CATEGORY_QUOTAS[category] || 0;
  const current = currentCounts[category] || 0;
  return current >= quota;
}

export async function getAllDailyQuotas() {
  const date = getBDMidnight();
  const quotas = await prisma.dailyQuota.findMany({ where: { date } });
  return quotas.map((q) => ({
    category: q.category,
    count: q.count,
    target: CATEGORY_QUOTAS[q.category] || 0,
  }));
}
