import Link from "next/link";
import {
  NotFoundNotice,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresOperatingAssetForm } from "@/components/postgres-preview/PostgresEntityForm";
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
        Plant / Facility editing writes to Railway PostgreSQL staging. Run the
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
    return <NotFoundNotice label="Operating asset" backHref="/postgres-preview" />;
  }

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <Link
            href={`/postgres-preview/operating-assets/${id}`}
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Plant / Facility
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Edit Plant / Facility
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Update the staging operating asset record. Draft saves remain
                allowed while source evidence, owner/operator roles, and
                originating project or unit relationships are completed through
                the saved detail workflow.
              </p>
            </div>
            {data.ok ? (
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={data.asset.primary_use_type_code} />
                <StatusBadge value={data.asset.lifecycle_phase_code} />
                <StatusBadge value={data.asset.review_status_code} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

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
