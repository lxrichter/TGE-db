import {
  OperatingAssetsPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewOperatingAssets,
  type PostgresPreviewOperatingAsset,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 500;

type OperatingAssetsListData =
  | {
      ok: true;
      operatingAssets: PostgresPreviewOperatingAsset[];
      total: number;
    }
  | {
      ok: false;
      error: string;
    };

async function getOperatingAssetsListData(): Promise<OperatingAssetsListData> {
  try {
    const [summary, operatingAssets] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewOperatingAssets(LIST_LIMIT),
    ]);

    return {
      ok: true,
      operatingAssets,
      total: summary.operatingAssetCount,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function PostgresOperatingAssetsListPage() {
  const data = await getOperatingAssetsListData();

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
          total={data.total}
        />
      )}
    </main>
  );
}
