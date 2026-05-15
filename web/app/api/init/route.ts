import { NextResponse } from "next/server";
import { initDb } from "@/lib/init-db";

export async function GET() {
  try {
    const result = await initDb();
    return NextResponse.json(result);
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}