import {
  OperatingAssetsPreviewTable,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListFilters,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  previewFilterOptions,
  type PreviewFilterOption,
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

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: "/postgres-preview/operating-assets/new",
            label: "New Plant / Facility",
            variant: "primary",
          },
        ]}
        description="PostgreSQL staging list for operating plants, facilities, units, and future direct-use or hybrid operating assets."
        eyebrow="PostgreSQL Staging"
        title="Plants / Facilities"
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
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
                name: "use",
                label: "Use Type",
                value: data.filters.useType,
                placeholder: "All Use Types",
                options: previewFilterOptions(data.facets.useTypes),
              },
              {
                name: "status",
                label: "Operating Status",
                value: data.filters.status,
                placeholder: "All Operating States",
                options: previewFilterOptions(data.facets.statuses),
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
