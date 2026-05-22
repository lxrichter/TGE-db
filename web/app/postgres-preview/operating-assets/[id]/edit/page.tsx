import Link from "next/link";
import {
  NotFoundNotice,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresOperatingAssetForm } from "@/components/postgres-preview/PostgresEntityForm";
import NextActionStrip from "@/components/ui/NextActionStrip";
import {
  getPostgresEntityFormReferenceData,
  getPostgresPreviewProjectById,
  getPostgresPreviewOperatingAssetById,
  listPostgresOperatingAssetCompanyLinks,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type FormData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getPostgresEntityFormReferenceData>>;
      asset: NonNullable<
        Awaited<ReturnType<typeof getPostgresPreviewOperatingAssetById>>
      >;
      companyLinks: Awaited<ReturnType<typeof listPostgresOperatingAssetCompanyLinks>>;
      originatingProject: {
        project_id: string;
        project_name: string;
        country: string | null;
      } | null;
    }
  | {
      ok: false;
      error: string;
    };

async function getFormData(operatingAssetId: string): Promise<FormData> {
  try {
    const [referenceData, asset, companyLinks] = await Promise.all([
      getPostgresEntityFormReferenceData(),
      getPostgresPreviewOperatingAssetById(operatingAssetId),
      listPostgresOperatingAssetCompanyLinks(operatingAssetId),
    ]);

    if (!asset) {
      return { ok: false, error: "not_found" };
    }

    const originatingProject = asset.promoted_from_project_id
      ? await getPostgresPreviewProjectById(asset.promoted_from_project_id)
      : null;

    return {
      ok: true,
      referenceData,
      asset,
      companyLinks,
      originatingProject: originatingProject
        ? {
            project_id: originatingProject.project_id,
            project_name: originatingProject.project_name,
            country: originatingProject.country,
          }
        : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Plant editing writes to Railway PostgreSQL staging. Run the
        app through Railway variables or set `DATABASE_PUBLIC_URL` /
        `DATABASE_URL` locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function EditPostgresOperatingAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getFormData(id);

  if (!data.ok && data.error === "not_found") {
    return <NotFoundNotice label="Plant" backHref="/postgres-preview" />;
  }

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href={`/postgres-preview/operating-assets/${id}`}
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Plant
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                Edit Plant
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                Update the staging plant record. Draft saves remain
                allowed while source evidence, owner/operator roles, and
                originating project or unit relationships are completed through
                the saved detail workflow.
              </p>
            </div>
            {data.ok ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                <StatusBadge value={data.asset.primary_use_type_code} />
                <StatusBadge
                  domain="lifecycle"
                  value={data.asset.lifecycle_phase_code}
                />
                <StatusBadge
                  domain="review"
                  value={data.asset.review_status_code}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <NextActionStrip
        title="Editing Context"
        description="Keep the saved profile, source creation, and Research Ops queue close while editing."
        actions={[
          {
            label: "Profile",
            title: "Back to plant",
            description:
              "Return to readiness, evidence, company roles, originating project, and export checks.",
            href: `/postgres-preview/operating-assets/${id}`,
          },
          {
            label: "Evidence",
            title: "Add source evidence",
            description:
              "Create a source record with this plant preselected as the linked target.",
            href: `/sources/new?entityType=operating_asset&entityId=${id}`,
          },
          {
            label: "Operations",
            title: "Open Research Ops",
            description:
              "Review missing data, validation, source gaps, and persistent issues.",
            href: "/postgres-preview/research-ops",
          },
        ]}
      />

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <PostgresOperatingAssetForm
          asset={data.asset}
          mode="edit"
          relationshipPreview={{
            companyLinks: data.companyLinks,
            originatingProject: data.originatingProject,
          }}
          referenceData={data.referenceData}
        />
      )}
    </main>
  );
}
