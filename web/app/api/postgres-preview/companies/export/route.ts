import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canExport, type UserRole } from "@/lib/auth/roles";
import { csvDownloadResponse, type CsvColumn } from "@/lib/export/csv";
import {
  listPostgresPreviewCompanies,
  type PostgresPreviewCompany,
  type PostgresPreviewCompanyListFilters,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 10000;

const companyExportColumns: CsvColumn<PostgresPreviewCompany>[] = [
  { header: "company_id", value: (row) => row.company_id },
  { header: "legacy_company_id", value: (row) => row.legacy_company_id },
  { header: "company_name", value: (row) => row.company_name },
  { header: "entity_type_code", value: (row) => row.entity_type_code },
  {
    header: "company_type_primary_code",
    value: (row) => row.company_type_primary_code,
  },
  { header: "headquarters_country", value: (row) => row.headquarters_country },
  { header: "website_url", value: (row) => row.website_url },
  { header: "geothermal_focus", value: (row) => row.geothermal_focus },
  { header: "review_status_code", value: (row) => row.review_status_code },
  { header: "research_status", value: (row) => row.research_status },
  { header: "source_count", value: (row) => row.source_count },
  { header: "project_link_count", value: (row) => row.project_link_count },
  {
    header: "operating_asset_link_count",
    value: (row) => row.operating_asset_link_count,
  },
];

function cleanParam(value: string | null) {
  return value?.trim() || undefined;
}

function companyFiltersFromSearchParams(
  searchParams: URLSearchParams
): PostgresPreviewCompanyListFilters {
  return {
    search: cleanParam(searchParams.get("search")),
    country: cleanParam(searchParams.get("country")),
    reviewStatus: cleanParam(searchParams.get("review")),
    companyType: cleanParam(searchParams.get("companyType")),
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

    const rows = await listPostgresPreviewCompanies({
      filters: companyFiltersFromSearchParams(request.nextUrl.searchParams),
      limit: EXPORT_LIMIT,
      offset: 0,
    });
    const stamp = new Date().toISOString().slice(0, 10);

    return csvDownloadResponse({
      columns: companyExportColumns,
      filename: `tge-postgres-companies-${stamp}.csv`,
      rows,
    });
  } catch (error) {
    console.error("GET /api/postgres-preview/companies/export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to export PostgreSQL companies: ${error.message}`
            : "Failed to export PostgreSQL companies",
      },
      { status: 500 }
    );
  }
}
