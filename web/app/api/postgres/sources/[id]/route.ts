import { NextResponse } from "next/server";
import { getSourceById } from "@/lib/services/sources";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const source = await getSourceById(id);

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error("PostgreSQL source detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL source." },
      { status: 500 }
    );
  }
}
