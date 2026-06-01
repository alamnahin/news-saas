import { prisma } from "./prisma";

export async function logError(
  step: string,
  message: string,
  details?: string
) {
  try {
    await prisma.errorLog.create({
      data: { step, message, details: details?.substring(0, 2000) },
    });
  } catch {
    // Fallback to console if DB is unavailable
    console.error(`[${step}] ${message}`, details);
  }
}
