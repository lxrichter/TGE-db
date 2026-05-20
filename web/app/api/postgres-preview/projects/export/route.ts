import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canExport, type UserRole } from "@/lib/auth/roles";
import { csvDownloadResponse, type CsvColumn } from "@/lib/export/csv";
import {
  listPostgresPreviewProjects,
  type PostgresPreviewProject,
  type PostgresPreviewProjectListFilters,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 10000;

const projectExportColumns: CsvColumn<PostgresPreviewProject>[] = [
  { header: "project_id", value: (row) => row.project_id },
  { header: "legacy_project_id", value: (row) => row.legacy_project_id },
  { header: "project_name", value: (row) => row.project_name },
  { header: "country", value: (row) => row.country },
  { header: "region", value: (row) => row.region },
  { header: "primary_use_type_code", value: (row) => row.primary_use_type_code },
  { header: "lifecycle_phase_code", value: (row) => row.lifecycle_phase_code },
  { header: "latitude", value: (row) => row.latitude },
  { header: "longitude", value: (row) => row.longitude },
  { header: "potential_min_mwe", value: (row) => row.potential_min_mwe },
  { header: "potential_max_mwe", value: (row) => row.potential_max_mwe },
  { header: "electric_capacity_mwe", value: (row) => row.electric_capacity_mwe },
  { header: "thermal_capacity_mwth", value: (row) => row.thermal_capacity_mwth },
  {
    header: "annual_power_generation_gwhe",
    value: (row) => row.annual_power_generation_gwhe,
  },
  {
    header: "annual_heat_supply_gwhth",
    value: (row) => row.annual_heat_supply_gwhth,
  },
  {
    header: "annual_cooling_supply_gwhc",
    value: (row) => row.annual_cooling_supply_gwhc,
  },
  { header: "review_status_code", value: (row) => row.review_status_code },
  { header: "research_status", value: (row) => row.research_status },
  { header: "source_count", value: (row) => row.source_count },
  { header: "company_link_count", value: (row) => row.company_link_count },
  { header: "open_issue_count", value: (row) => row.open_issue_count },
  { header: "critical_issue_count", value: (row) => row.critical_issue_count },
];

function cleanParam(value: string | null) {
  return value?.trim() || undefined;
}

function projectFiltersFromSearchParams(
  searchParams: URLSearchParams
): PostgresPreviewProjectListFilters {
  return {
    search: cleanParam(searchParams.get("search")),
    country: cleanParam(searchParams.get("country")),
    reviewStatus: cleanParam(searchParams.get("review")),
    useType: cleanParam(searchParams.get("use")),
    status: cleanParam(searchParams.get("status")),
    missing: cleanParam(searchParams.get("missing")),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = ((session.user as { role?: UserRole } | undefined)?.role ??
      null) as UserRole | null;

    if (!canExport(role)) {
      return NextResponse.json(
        { error: "Forbidden: export requires Editor+ or Administrator" },
        { status: 403 }
      );
    }

    const rows = await listPostgresPreviewProjects({
      filters: projectFiltersFromSearchParams(request.nextUrl.searchParams),
      limit: EXPORT_LIMIT,
      offset: 0,
    });
    const stamp = new Date().toISOString().slice(0, 10);

    return csvDownloadResponse({
      columns: projectExportColumns,
      filename: `tge-postgres-projects-${stamp}.csv`,
      rows,
    });
  } catch (error) {
    console.error("GET /api/postgres-preview/projects/export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to export PostgreSQL projects: ${error.message}`
            : "Failed to export PostgreSQL projects",
      },
      { status: 500 }
    );
  }
}
