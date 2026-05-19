import {
  CompaniesPreviewTable,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListFilters,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  PostgresPreviewQuickViews,
  previewQueryHref,
  previewFilterOptions,
  type PreviewFilterOption,
  type PreviewQuickView,
  type PreviewTableDensity,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  countPostgresPreviewCompanies,
  getPostgresPreviewCompanyListFacets,
  listPostgresPreviewCompanies,
  type PostgresPreviewCompany,
  type PostgresPreviewCompanyListFilters,
  type PostgresPreviewListFacets,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
  search?: string;
  country?: string;
  review?: string;
  companyType?: string;
  missing?: string;
};

type CompaniesListData =
  | {
      ok: true;
      companies: PostgresPreviewCompany[];
      total: number;
      filters: PostgresPreviewCompanyListFilters;
      facets: PostgresPreviewListFacets;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

const companyMissingOptions: PreviewFilterOption[] = [
  { value: "country", label: "Missing HQ Country" },
  { value: "website", label: "Missing Website" },
  { value: "primary_type", label: "Missing Primary Type" },
  { value: "source", label: "Missing Source" },
  { value: "activity_link", label: "Missing Project / Asset Link" },
];

const companyQuickViews: PreviewQuickView[] = [
  {
    label: "All Companies",
    description: "Full company staging list.",
    query: {},
  },
  {
    label: "Missing Source",
    description: "Companies without confirmed evidence links.",
    query: { missing: "source" },
  },
  {
    label: "Missing Activity Link",
    description: "Companies not yet linked to projects or assets.",
    query: { missing: "activity_link" },
  },
  {
    label: "Missing Website",
    description: "Companies without website or equivalent reference.",
    query: { missing: "website" },
  },
  {
    label: "Missing HQ Country",
    description: "Companies missing headquarters country.",
    query: { missing: "country" },
  },
  {
    label: "Missing Primary Type",
    description: "Companies without controlled primary category.",
    query: { missing: "primary_type" },
  },
  {
    label: "Drafts",
    description: "Company records still in draft state.",
    query: { review: "draft" },
  },
  {
    label: "Needs Update",
    description: "Previously reviewed records requiring re-check.",
    query: { review: "needs_update" },
  },
];

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function getCompanyFilters(
  params: PreviewListSearchParams
): PostgresPreviewCompanyListFilters {
  return {
    search: cleanParam(params.search),
    country: cleanParam(params.country),
    reviewStatus: cleanParam(params.review),
    companyType: cleanParam(params.companyType),
    missing: cleanParam(params.missing),
  };
}

async function getCompaniesListData(
  params: PreviewListSearchParams
): Promise<CompaniesListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const filters = getCompanyFilters(params);
  const offset = (page - 1) * pageSize;

  try {
    const [companies, filteredCount, facets] = await Promise.all([
      listPostgresPreviewCompanies({ limit: pageSize, offset, filters }),
      countPostgresPreviewCompanies(filters),
      getPostgresPreviewCompanyListFacets(),
    ]);

    return {
      ok: true,
      companies,
      total: filteredCount,
      filters,
      facets,
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
  const exportFilters = getCompanyFilters(resolvedSearchParams);

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: previewQueryHref("/api/postgres-preview/companies/export", {
              search: exportFilters.search,
              country: exportFilters.country,
              review: exportFilters.reviewStatus,
              companyType: exportFilters.companyType,
              missing: exportFilters.missing,
            }),
            label: "Export Filtered CSV",
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
        <>
          <PostgresPreviewQuickViews
            basePath="/postgres-preview/companies"
            currentQuery={{
              search: data.filters.search,
              country: data.filters.country,
              review: data.filters.reviewStatus,
              companyType: data.filters.companyType,
              missing: data.filters.missing,
            }}
            density={data.density}
            pageSize={data.pageSize}
            views={companyQuickViews}
          />
          <PostgresPreviewListFilters
            basePath="/postgres-preview/companies"
            density={data.density}
            pageSize={data.pageSize}
            search={data.filters.search}
            selects={[
              {
                name: "country",
                label: "HQ Country",
                value: data.filters.country,
                placeholder: "All Countries",
                options: previewFilterOptions(data.facets.countries),
              },
              {
                name: "review",
                label: "Review",
                value: data.filters.reviewStatus,
                placeholder: "All Review States",
                options: previewFilterOptions(data.facets.reviewStatuses),
              },
              {
                name: "companyType",
                label: "Company Type",
                value: data.filters.companyType,
                placeholder: "All Company Types",
                options: previewFilterOptions(data.facets.companyTypes),
              },
              {
                name: "missing",
                label: "Missing Data",
                value: data.filters.missing,
                placeholder: "Any Completeness",
                options: companyMissingOptions,
              },
            ]}
          />
          <CompaniesPreviewTable
            companies={data.companies}
            pagination={{
              basePath: "/postgres-preview/companies",
              density: data.density,
              page: data.page,
              pageSize: data.pageSize,
              total: data.total,
              query: {
                search: data.filters.search,
                country: data.filters.country,
                review: data.filters.reviewStatus,
                companyType: data.filters.companyType,
                missing: data.filters.missing,
              },
            }}
            total={data.total}
          />
        </>
      )}
    </main>
  );
}
