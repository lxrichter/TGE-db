import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "degraded";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();
  let status: HealthStatus = "ok";
  let postgres: HealthStatus = "ok";
  let postgresError: string | null = null;

  try {
    await getPrismaClient().$queryRawUnsafe("SELECT 1");
  } catch (error) {
    status = "degraded";
    postgres = "degraded";
    postgresError = error instanceof Error ? error.message : "Unknown error";
  }

  const payload = {
    status,
    checked_at: checkedAt,
    response_time_ms: Date.now() - startedAt,
    checks: {
      app: "ok" as const,
      postgres,
    },
    postgres_error: postgresError,
  };

  return NextResponse.json(payload, {
    status: status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
