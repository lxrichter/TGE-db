import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function extractNumericId(value: string) {
  const match = value.match(/^PLT-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatPlantId(num: number) {
  return `PLT-${String(num).padStart(6, "0")}`;
}

async function generateNextPlantId(db: Awaited<ReturnType<typeof getDb>>) {
  const rows = await db.all<{ plant_id: string }[]>(
    `SELECT plant_id FROM plants WHERE plant_id LIKE 'PLT-%'`
  );

  let maxId = 0;

  for (const row of rows) {
    const parsed = extractNumericId(row.plant_id);
    if (parsed !== null && parsed > maxId) {
      maxId = parsed;
    }
  }

  return formatPlantId(maxId + 1);
}

export async function GET() {
  try {
    const db = await getDb();
    const plant_id = await generateNextPlantId(db);

    return NextResponse.json({ plant_id });
  } catch (error) {
    console.error("GET /api/projects/[id]/promote-preview error:", error);

    return NextResponse.json(
      { error: "Failed to generate plant ID preview" },
      { status: 500 }
    );
  }
}