import {
  activePreviewQuickView,
  CompaniesPreviewTable,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListContext,
  PostgresPreviewListFilters,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  PostgresPreviewQuickViews,
  previewQueryHref,
  previewFilterOptionLabel,
  previewFilterOptions,
  type PreviewActiveFilter,
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
import NextActionStrip from "@/components/ui/NextActionStrip";
import PostgresEntityOverview, {
  formatOverviewCount,
  normalizeOverviewLabel,
  type OverviewBucket,
} from "@/components/postgres-preview/PostgresEntityOverview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
  search?: string;
  country?: string;
  tge_region?: string;
  wb_region?: string;
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
      ecosystemTotal: number;
      companyTypeCounts: CompanyTypeCount[];
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

type CompanyTypeCount = {
  value: string;
  count: number;
};

const companyMissingOptions: PreviewFilterOption[] = [
  { value: "country", label: "Missing HQ Country" },
  { value: "website", label: "Missing Website" },
  { value: "primary_type", label: "Missing Primary Type" },
  { value: "source", label: "Missing Source" },
  { value: "activity_link", label: "Missing Project / Plant Link" },
  { value: "research_issue", label: "Open Research Ops Issues" },
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
    description: "Companies not yet linked to projects or plants.",
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
    label: "Open Issues",
    description: "Companies with persistent Research Ops follow-ups.",
    query: { missing: "research_issue" },
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
    tgeRegion: cleanParam(params.tge_region),
    wbRegion: cleanParam(params.wb_region),
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
    const geographyFilters = {
      country: filters.country,
      tgeRegion: filters.tgeRegion,
      wbRegion: filters.wbRegion,
    };
    const [ecosystemTotal, companyTypeCounts] = await Promise.all([
      countPostgresPreviewCompanies(geographyFilters),
      Promise.all(
        facets.companyTypes.map(async (companyType) => ({
          value: companyType,
          count: await countPostgresPreviewCompanies({
            ...geographyFilters,
            companyType,
          }),
        }))
      ),
    ]);
    const topCompanyTypeCounts = companyTypeCounts
      .filter((entry) => entry.count > 0)
      .sort(
        (a, b) =>
          b.count - a.count ||
          normalizeOverviewLabel(a.value).localeCompare(
            normalizeOverviewLabel(b.value)
          )
      )
      .slice(0, 6);

    return {
      ok: true,
      companies,
      total: filteredCount,
      filters,
      facets,
      ecosystemTotal,
      companyTypeCounts: topCompanyTypeCounts,
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

function companyTypeBuckets(companyTypeCounts: CompanyTypeCount[]): OverviewBucket[] {
  return companyTypeCounts.map((entry) => ({
    label: normalizeOverviewLabel(entry.value),
    count: entry.count,
    href: `/postgres-preview/companies?companyType=${encodeURIComponent(
      entry.value
    )}`,
    tone: "ecosystem",
  }));
}

export default async function PostgresCompaniesListPage({
  searchParams,
}: {
  searchParams?: Promise<PreviewListSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getCompaniesListData(resolvedSearchParams);
  const exportFilters = getCompanyFilters(resolvedSearchParams);
  const exportHref = previewQueryHref("/api/postgres-preview/companies/export", {
    search: exportFilters.search,
    country: exportFilters.country,
    tge_region: exportFilters.tgeRegion,
    wb_region: exportFilters.wbRegion,
    review: exportFilters.reviewStatus,
    companyType: exportFilters.companyType,
    missing: exportFilters.missing,
  });
  const currentQuery = data.ok
    ? {
        search: data.filters.search,
        country: data.filters.country,
        tge_region: data.filters.tgeRegion,
        wb_region: data.filters.wbRegion,
        review: data.filters.reviewStatus,
        companyType: data.filters.companyType,
        missing: data.filters.missing,
      }
    : {};
  const reviewOptions = data.ok
    ? [
        {
          value: "draft_or_validation",
          label: "Draft / Validation",
        },
        ...previewFilterOptions(data.facets.reviewStatuses),
      ]
    : [];
  const companyTypeOptions = data.ok
    ? previewFilterOptions(data.facets.companyTypes)
    : [];
  const countryOptions = data.ok ? previewFilterOptions(data.facets.countries) : [];
  const tgeRegionOptions = data.ok
    ? previewFilterOptions(data.facets.tgeRegions)
    : [];
  const wbRegionOptions = data.ok
    ? previewFilterOptions(data.facets.wbRegions)
    : [];
  const activeFilters: PreviewActiveFilter[] = data.ok
    ? [
        data.filters.search
          ? { label: "Search", value: data.filters.search }
          : null,
        data.filters.country
          ? {
              label: "HQ Country",
              value:
                previewFilterOptionLabel(countryOptions, data.filters.country) ||
                data.filters.country,
            }
          : null,
        data.filters.tgeRegion
          ? {
              label: "TGE Region",
              value:
                previewFilterOptionLabel(
                  tgeRegionOptions,
                  data.filters.tgeRegion
                ) || data.filters.tgeRegion,
            }
          : null,
        data.filters.wbRegion
          ? {
              label: "WB Region",
              value:
                previewFilterOptionLabel(wbRegionOptions, data.filters.wbRegion) ||
                data.filters.wbRegion,
            }
          : null,
        data.filters.reviewStatus
          ? {
              label: "Review",
              value:
                previewFilterOptionLabel(reviewOptions, data.filters.reviewStatus) ||
                data.filters.reviewStatus,
            }
          : null,
        data.filters.companyType
          ? {
              label: "Business Identity",
              value:
                previewFilterOptionLabel(
                  companyTypeOptions,
                  data.filters.companyType
                ) || data.filters.companyType,
            }
          : null,
        data.filters.missing
          ? {
              label: "Missing Data",
              value:
                previewFilterOptionLabel(companyMissingOptions, data.filters.missing) ||
                data.filters.missing,
            }
          : null,
      ].filter((filter): filter is PreviewActiveFilter => Boolean(filter))
    : [];
  const activeView = data.ok
    ? activePreviewQuickView({
        currentQuery,
        views: companyQuickViews,
      })
    : null;

  return (
    <main className="space-y-6 sm:space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: exportHref,
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

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the three most common company-list workflows: evidence, relationships, and classification."
        actions={[
          {
            label: "Evidence",
            title: "Companies missing sources",
            description: "Open records that need source evidence before profile use or export.",
            href: "/postgres-preview/companies?missing=source",
          },
          {
            label: "Relationships",
            title: "Companies missing activity links",
            description: "Link companies to project and plant roles.",
            href: "/postgres-preview/companies?missing=activity_link",
          },
          {
            label: "Classification",
            title: "Companies missing identity",
            description: "Review records that need a controlled primary business identity.",
            href: "/postgres-preview/companies?missing=primary_type",
          },
        ]}
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <PostgresPreviewQuickViews
            basePath="/postgres-preview/companies"
            currentQuery={currentQuery}
            density={data.density}
            pageSize={data.pageSize}
            views={companyQuickViews}
          />
          <PostgresEntityOverview
            bucketEntityLabel="companies"
            buckets={companyTypeBuckets(data.companyTypeCounts)}
            bucketsTitle="Business identity distribution"
            description="Compact ecosystem intelligence before the operational company table."
            label="Ecosystem Intelligence"
            metrics={[
              {
                label: "Total Companies",
                value: formatOverviewCount(data.ecosystemTotal),
                note: "Companies in current geography scope",
                href: "/postgres-preview/companies",
                tone: "ecosystem",
              },
              {
                label: "Business Identities",
                value: formatOverviewCount(data.facets.companyTypes.length),
                note: "Controlled primary company categories represented",
                href: "/postgres-preview/companies",
                tone: "ecosystem",
              },
              {
                label: "HQ Markets",
                value: formatOverviewCount(data.facets.countries.length),
                note: "Headquarters country values in staging",
                href: "/postgres-preview/countries",
                tone: "market",
              },
              {
                label: "Visible Rows",
                value: formatOverviewCount(data.total),
                note: "Companies matching current table filters",
                href: exportHref,
                tone: "neutral",
              },
            ]}
            title="Geothermal Ecosystem Snapshot"
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
                options: countryOptions,
              },
              {
                name: "tge_region",
                label: "TGE Region",
                value: data.filters.tgeRegion,
                placeholder: "All TGE Regions",
                options: tgeRegionOptions,
              },
              {
                name: "wb_region",
                label: "WB Region",
                value: data.filters.wbRegion,
                placeholder: "All WB Regions",
                options: wbRegionOptions,
              },
              {
                name: "review",
                label: "Review",
                value: data.filters.reviewStatus,
                placeholder: "All Review States",
                options: reviewOptions,
              },
              {
                name: "companyType",
                label: "Business Identity",
                value: data.filters.companyType,
                placeholder: "All Business Identities",
                options: companyTypeOptions,
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
          <PostgresPreviewListContext
            activeFilters={activeFilters}
            activeViewLabel={activeView?.label || "Custom Company View"}
            entityLabel="companies"
            exportHref={exportHref}
            page={data.page}
            pageSize={data.pageSize}
            shownCount={data.companies.length}
            total={data.total}
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
                tge_region: data.filters.tgeRegion,
                wb_region: data.filters.wbRegion,
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
