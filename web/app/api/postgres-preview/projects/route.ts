import { NextResponse } from "next/server";
import { listPostgresPreviewProjects } from "@/lib/postgres-preview";

export async function GET() {
  try {
    const projects = await listPostgresPreviewProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("PostgreSQL preview projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview projects." },
      { status: 500 }
    );
  }
}
