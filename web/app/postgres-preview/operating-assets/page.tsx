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
  getPostgresPreviewAnalysisSummary,
  getPostgresPreviewOperatingAssetListFacets,
  listPostgresPreviewOperatingAssets,
  type PostgresPreviewAnalysisBucket,
  type PostgresPreviewAnalysisSummary,
  type PostgresPreviewListFacets,
  type PostgresPreviewOperatingAsset,
  type PostgresPreviewOperatingAssetListFilters,
} from "@/lib/postgres-preview";
import NextActionStrip from "@/components/ui/NextActionStrip";
import PostgresEntityOverview, {
  formatOverviewCount,
  formatOverviewMwe,
  normalizeOverviewLabel,
  type OverviewBucket,
} from "@/components/postgres-preview/PostgresEntityOverview";
import { postgresStatusTone } from "@/components/postgres-preview/PostgresStatusBadge";

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
      analysis: PostgresPreviewAnalysisSummary;
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
    description: "Currently operating plants.",
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
    description: "Direct-use operating plants.",
    query: { use: "direct_use" },
  },
  {
    label: "Needs Update",
    description: "Previously reviewed plants requiring re-check.",
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
    tgeRegion: cleanParam(params.tge_region),
    wbRegion: cleanParam(params.wb_region),
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
    const analysisFilters = {
      country: filters.country,
      tgeRegion: filters.tgeRegion,
      wbRegion: filters.wbRegion,
    };
    const [operatingAssets, filteredCount, facets, analysis] = await Promise.all([
      listPostgresPreviewOperatingAssets({ limit: pageSize, offset, filters }),
      countPostgresPreviewOperatingAssets(filters),
      getPostgresPreviewOperatingAssetListFacets(),
      getPostgresPreviewAnalysisSummary(analysisFilters),
    ]);

    return {
      ok: true,
      operatingAssets,
      total: filteredCount,
      filters,
      facets,
      analysis,
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

const plantStatusOrder = [
  "operating",
  "partially_operating",
  "temporarily_offline",
  "under_refurbishment",
  "retired_decommissioned",
  "retired",
  "decommissioned",
  "unknown",
];

function bucketCount(buckets: PostgresPreviewAnalysisBucket[]) {
  return buckets.reduce((total, bucket) => total + bucket.record_count, 0);
}

function bucketMwe(buckets: PostgresPreviewAnalysisBucket[]) {
  return buckets.reduce(
    (total, bucket) => total + bucket.electric_capacity_mwe,
    0
  );
}

function plantStatusBuckets(
  buckets: PostgresPreviewAnalysisBucket[]
): OverviewBucket[] {
  return [...buckets]
    .sort((a, b) => {
      const aIndex = plantStatusOrder.indexOf(a.bucket_code);
      const bIndex = plantStatusOrder.indexOf(b.bucket_code);

      return (
        (aIndex === -1 ? 999 : aIndex) -
          (bIndex === -1 ? 999 : bIndex) ||
        b.electric_capacity_mwe - a.electric_capacity_mwe ||
        b.record_count - a.record_count ||
        a.bucket_code.localeCompare(b.bucket_code)
      );
    })
    .slice(0, 6)
    .map((bucket) => ({
      label: normalizeOverviewLabel(bucket.bucket_code),
      count: bucket.record_count,
      capacityMwe: bucket.electric_capacity_mwe,
      href: `/postgres-preview/operating-assets?status=${encodeURIComponent(
        bucket.bucket_code
      )}`,
      tone: postgresStatusTone(bucket.bucket_code, "lifecycle"),
    }));
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
      tge_region: exportFilters.tgeRegion,
      wb_region: exportFilters.wbRegion,
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
        tge_region: data.filters.tgeRegion,
        wb_region: data.filters.wbRegion,
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
              label: "Market",
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
  const marketOverviewHref = data.ok
    ? `${previewQueryHref("/postgres-preview/markets", {
        country: data.filters.country,
        tge_region: data.filters.tgeRegion,
        wb_region: data.filters.wbRegion,
      })}#market-rankings`
    : "/postgres-preview/markets#market-rankings";

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
        description="PostgreSQL staging list for operating plants, units, and future direct-use or hybrid plants."
        eyebrow="PostgreSQL Staging"
        title="Plants"
      />

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the three most common plant-list workflows: evidence, relationships, and operating readiness."
        actions={[
          {
            label: "Evidence",
            title: "Plants missing sources",
            description: "Open plants that need confirmed source evidence.",
            href: "/postgres-preview/operating-assets?missing=source",
          },
          {
            label: "Relationships",
            title: "Plants missing companies",
            description: "Add structured owner, operator, supplier, or offtaker links.",
            href: "/postgres-preview/operating-assets?missing=company_link",
          },
          {
            label: "Readiness",
            title: "Plants missing COD",
            description: "Review COD and original commissioning wording gaps.",
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
          <PostgresEntityOverview
            bucketEntityLabel="plants"
            bucketLayout="single-line"
            bucketValuePriority="capacity"
            buckets={plantStatusBuckets(data.analysis.operatingAssetStatus)}
            bucketsTitle="Operating status distribution"
            description="Compact operational-status intelligence before the plant table."
            label="Fleet Intelligence"
            metrics={[
              {
                label: "Total Plants",
                value: formatOverviewCount(
                  bucketCount(data.analysis.operatingAssetStatus)
                ),
                note: "Plants in current geography scope",
                href: "/postgres-preview/operating-assets",
                tone: "operating",
              },
              {
                label: "Installed MWe",
                value: formatOverviewMwe(
                  bucketMwe(data.analysis.operatingAssetStatus)
                ),
                note: "Combined operating fleet capacity signal",
                href: "/postgres-preview/analysis",
                tone: "operating",
              },
              {
                label: "Markets",
                value: formatOverviewCount(data.analysis.topCountries.length),
                note: "Markets represented in this plant view",
                href: marketOverviewHref,
                tone: "market",
              },
              {
                label: "Visible Rows",
                value: formatOverviewCount(data.total),
                note: "Plants matching current table filters",
                href: exportHref,
                tone: "neutral",
              },
            ]}
            title="Operating Fleet Snapshot"
          />
          <PostgresPreviewListFilters
            basePath="/postgres-preview/operating-assets"
            density={data.density}
            pageSize={data.pageSize}
            search={data.filters.search}
            selects={[
              {
                name: "country",
                label: "Market",
                value: data.filters.country,
                placeholder: "All Markets",
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
                tge_region: data.filters.tgeRegion,
                wb_region: data.filters.wbRegion,
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
