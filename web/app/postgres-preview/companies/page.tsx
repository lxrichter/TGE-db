import {
  CompaniesPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewCompanies,
  type PostgresPreviewCompany,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 500;

type CompaniesListData =
  | {
      ok: true;
      companies: PostgresPreviewCompany[];
      total: number;
    }
  | {
      ok: false;
      error: string;
    };

async function getCompaniesListData(): Promise<CompaniesListData> {
  try {
    const [summary, companies] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewCompanies(LIST_LIMIT),
    ]);

    return {
      ok: true,
      companies,
      total: summary.companyCount,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function PostgresCompaniesListPage() {
  const data = await getCompaniesListData();

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
        <CompaniesPreviewTable companies={data.companies} total={data.total} />
      )}
    </main>
  );
}
