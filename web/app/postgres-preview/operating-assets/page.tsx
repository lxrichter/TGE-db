import {
  OperatingAssetsPreviewTable,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  type PreviewTableDensity,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewOperatingAssets,
  type PostgresPreviewOperatingAsset,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
};

type OperatingAssetsListData =
  | {
      ok: true;
      operatingAssets: PostgresPreviewOperatingAsset[];
      total: number;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

async function getOperatingAssetsListData(
  params: PreviewListSearchParams
): Promise<OperatingAssetsListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const offset = (page - 1) * pageSize;

  try {
    const [summary, operatingAssets] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewOperatingAssets({ limit: pageSize, offset }),
    ]);

    return {
      ok: true,
      operatingAssets,
      total: summary.operatingAssetCount,
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
        <OperatingAssetsPreviewTable
          operatingAssets={data.operatingAssets}
          pagination={{
            basePath: "/postgres-preview/operating-assets",
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
