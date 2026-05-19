import {
  CompaniesPreviewTable,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  type PreviewTableDensity,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewCompanies,
  type PostgresPreviewCompany,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
};

type CompaniesListData =
  | {
      ok: true;
      companies: PostgresPreviewCompany[];
      total: number;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

async function getCompaniesListData(
  params: PreviewListSearchParams
): Promise<CompaniesListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const offset = (page - 1) * pageSize;

  try {
    const [summary, companies] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewCompanies({ limit: pageSize, offset }),
    ]);

    return {
      ok: true,
      companies,
      total: summary.companyCount,
      page,
      pageSize,
      density,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function PostgresCompaniesListPage({
  searchParams,
}: {
  searchParams?: Promise<PreviewListSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getCompaniesListData(resolvedSearchParams);

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: "/postgres-preview/companies/new",
            label: "New Company",
            variant: "primary",
          },
        ]}
        description="PostgreSQL staging list for company profiles, controlled categories, and future relationship/role intelligence."
        eyebrow="PostgreSQL Staging"
        title="Companies"
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <CompaniesPreviewTable
          companies={data.companies}
          pagination={{
            basePath: "/postgres-preview/companies",
            density: data.density,
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
          }}
          total={data.total}
        />
      )}
    </main>
  );
}
