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

const plantEditClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  link:
    "text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:underline",
  warning:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5",
  warningText: "text-[var(--tge-governance-attention-text)]",
};

function SetupNotice({ error }: { error: string }) {
  return (
    <section className={plantEditClass.warning}>
      <h2 className={`text-lg font-bold ${plantEditClass.warningText}`}>
        PostgreSQL Not Connected
      </h2>
      <p className={`mt-2 max-w-3xl text-sm leading-6 ${plantEditClass.warningText}`}>
        Plant editing writes to Railway PostgreSQL staging. Run the
        app through Railway variables or set `DATABASE_PUBLIC_URL` /
        `DATABASE_URL` locally.
      </p>
      <p className={`mt-3 text-xs ${plantEditClass.warningText}`}>
        Error: {error}
      </p>
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
      <section className={plantEditClass.panel}>
        <div className={plantEditClass.hero}>
          <Link
            href={`/postgres-preview/operating-assets/${id}`}
            className={plantEditClass.link}
          >
            Back to Plant
          </Link>
          <p className={`mt-4 ${plantEditClass.kicker}`}>
            Entity Workspace
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${plantEditClass.title}`}>
                Edit Plant
              </h1>
              <p className={`mt-3 max-w-4xl text-sm leading-6 sm:mt-4 sm:text-base sm:leading-7 ${plantEditClass.body}`}>
                Update the plant profile. Draft saves remain allowed while
                source evidence, owner/operator roles, and originating project
                or unit relationships are completed through the saved detail
                workflow.
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
