import {
  activePreviewQuickView,
  OperatingAssetsPreviewTable,
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
  countPostgresPreviewOperatingAssets,
  getPostgresPreviewOperatingAssetListFacets,
  listPostgresPreviewOperatingAssets,
  type PostgresPreviewListFacets,
  type PostgresPreviewOperatingAsset,
  type PostgresPreviewOperatingAssetListFilters,
} from "@/lib/postgres-preview";
import NextActionStrip from "@/components/ui/NextActionStrip";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
  search?: string;
  country?: string;
  review?: string;
  use?: string;
  status?: string;
  missing?: string;
};

type OperatingAssetsListData =
  | {
      ok: true;
      operatingAssets: PostgresPreviewOperatingAsset[];
      total: number;
      filters: PostgresPreviewOperatingAssetListFilters;
      facets: PostgresPreviewListFacets;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

const operatingAssetMissingOptions: PreviewFilterOption[] = [
  { value: "country", label: "Missing Country" },
  { value: "coordinates", label: "Missing Coordinates" },
  { value: "capacity", label: "Missing Capacity / Output" },
  { value: "use_type", label: "Missing Use Type" },
  { value: "status", label: "Missing Operating Status" },
  { value: "source", label: "Missing Source" },
  { value: "company_link", label: "Missing Company Link" },
  { value: "cod", label: "Missing COD / Year" },
  { value: "research_issue", label: "Open Research Ops Issues" },
];

const operatingAssetQuickViews: PreviewQuickView[] = [
  {
    label: "All Plants",
    description: "Full plant staging list.",
    query: {},
  },
  {
    label: "Operating",
    description: "Currently operating plant records.",
    query: { status: "operating" },
  },
  {
    label: "Missing Source",
    description: "Plants without confirmed evidence links.",
    query: { missing: "source" },
  },
  {
    label: "Missing Coordinates",
    description: "Plants not ready for coordinate-confirmed maps.",
    query: { missing: "coordinates" },
  },
  {
    label: "Missing Company Link",
    description: "Plants without structured owner/operator relationships.",
    query: { missing: "company_link" },
  },
  {
    label: "Missing COD",
    description: "Plants missing commissioning year.",
    query: { missing: "cod" },
  },
  {
    label: "Open Issues",
    description: "Plants with persistent Research Ops follow-ups.",
    query: { missing: "research_issue" },
  },
  {
    label: "Direct-Use",
    description: "Direct-use operating facilities.",
    query: { use: "direct_use" },
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

function getOperatingAssetFilters(
  params: PreviewListSearchParams
): PostgresPreviewOperatingAssetListFilters {
  return {
    search: cleanParam(params.search),
    country: cleanParam(params.country),
    reviewStatus: cleanParam(params.review),
    useType: cleanParam(params.use),
    status: cleanParam(params.status),
    missing: cleanParam(params.missing),
  };
}

async function getOperatingAssetsListData(
  params: PreviewListSearchParams
): Promise<OperatingAssetsListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const filters = getOperatingAssetFilters(params);
  const offset = (page - 1) * pageSize;

  try {
    const [operatingAssets, filteredCount, facets] = await Promise.all([
      listPostgresPreviewOperatingAssets({ limit: pageSize, offset, filters }),
      countPostgresPreviewOperatingAssets(filters),
      getPostgresPreviewOperatingAssetListFacets(),
    ]);

    return {
      ok: true,
      operatingAssets,
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

export default async function PostgresOperatingAssetsListPage({
  searchParams,
}: {
  searchParams?: Promise<PreviewListSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getOperatingAssetsListData(resolvedSearchParams);
  const exportFilters = getOperatingAssetFilters(resolvedSearchParams);
  const exportHref = previewQueryHref(
    "/api/postgres-preview/operating-assets/export",
    {
      search: exportFilters.search,
      country: exportFilters.country,
      review: exportFilters.reviewStatus,
      use: exportFilters.useType,
      status: exportFilters.status,
      missing: exportFilters.missing,
    }
  );
  const currentQuery = data.ok
    ? {
        search: data.filters.search,
        country: data.filters.country,
        review: data.filters.reviewStatus,
        use: data.filters.useType,
        status: data.filters.status,
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
  const useOptions = data.ok ? previewFilterOptions(data.facets.useTypes) : [];
  const statusOptions = data.ok ? previewFilterOptions(data.facets.statuses) : [];
  const countryOptions = data.ok ? previewFilterOptions(data.facets.countries) : [];
  const activeFilters: PreviewActiveFilter[] = data.ok
    ? [
        data.filters.search
          ? { label: "Search", value: data.filters.search }
          : null,
        data.filters.country
          ? {
              label: "Country",
              value:
                previewFilterOptionLabel(countryOptions, data.filters.country) ||
                data.filters.country,
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
        data.filters.useType
          ? {
              label: "Use Type",
              value:
                previewFilterOptionLabel(useOptions, data.filters.useType) ||
                data.filters.useType,
            }
          : null,
        data.filters.status
          ? {
              label: "Operating Status",
              value:
                previewFilterOptionLabel(statusOptions, data.filters.status) ||
                data.filters.status,
            }
          : null,
        data.filters.missing
          ? {
              label: "Missing Data",
              value:
                previewFilterOptionLabel(
                  operatingAssetMissingOptions,
                  data.filters.missing
                ) || data.filters.missing,
            }
          : null,
      ].filter((filter): filter is PreviewActiveFilter => Boolean(filter))
    : [];
  const activeView = data.ok
    ? activePreviewQuickView({
        currentQuery,
        views: operatingAssetQuickViews,
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
            href: "/postgres-preview/operating-assets/new",
            label: "New Plant",
            variant: "primary",
          },
        ]}
        description="PostgreSQL staging list for operating plants, units, and future direct-use or hybrid plant records."
        eyebrow="PostgreSQL Staging"
        title="Plants"
      />

      <NextActionStrip
        description="From Plants, the next step should be evidence cleanup, operator/owner relationship work, or operating readiness review."
        actions={[
          {
            label: "Evidence Work",
            title: "Plants missing sources",
            description: "Focus on plant records that need confirmed source evidence.",
            href: "/postgres-preview/operating-assets?missing=source",
          },
          {
            label: "Relationship Work",
            title: "Plants missing companies",
            description: "Route records into structured owner, operator, supplier, or offtaker linking.",
            href: "/postgres-preview/operating-assets?missing=company_link",
          },
          {
            label: "Readiness Cleanup",
            title: "Plants missing COD",
            description: "Inspect commissioned plants where COD or original commissioning wording needs review.",
            href: "/postgres-preview/operating-assets?missing=cod",
          },
        ]}
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <PostgresPreviewQuickViews
            basePath="/postgres-preview/operating-assets"
            currentQuery={currentQuery}
            density={data.density}
            pageSize={data.pageSize}
            views={operatingAssetQuickViews}
          />
          <PostgresPreviewListFilters
            basePath="/postgres-preview/operating-assets"
            density={data.density}
            pageSize={data.pageSize}
            search={data.filters.search}
            selects={[
              {
                name: "country",
                label: "Country",
                value: data.filters.country,
                placeholder: "All Countries",
                options: countryOptions,
              },
              {
                name: "review",
                label: "Review",
                value: data.filters.reviewStatus,
                placeholder: "All Review States",
                options: reviewOptions,
              },
              {
                name: "use",
                label: "Use Type",
                value: data.filters.useType,
                placeholder: "All Use Types",
                options: useOptions,
              },
              {
                name: "status",
                label: "Operating Status",
                value: data.filters.status,
                placeholder: "All Operating States",
                options: statusOptions,
              },
              {
                name: "missing",
                label: "Missing Data",
                value: data.filters.missing,
                placeholder: "Any Completeness",
                options: operatingAssetMissingOptions,
              },
            ]}
          />
          <PostgresPreviewListContext
            activeFilters={activeFilters}
            activeViewLabel={activeView?.label || "Custom Plant View"}
            entityLabel="plants"
            exportHref={exportHref}
            page={data.page}
            pageSize={data.pageSize}
            shownCount={data.operatingAssets.length}
            total={data.total}
          />
          <OperatingAssetsPreviewTable
            operatingAssets={data.operatingAssets}
            pagination={{
              basePath: "/postgres-preview/operating-assets",
              density: data.density,
              page: data.page,
              pageSize: data.pageSize,
              total: data.total,
              query: {
                search: data.filters.search,
                country: data.filters.country,
                review: data.filters.reviewStatus,
                use: data.filters.useType,
                status: data.filters.status,
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
