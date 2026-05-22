import Link from "next/link";
import {
  NotFoundNotice,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresCompanyForm } from "@/components/postgres-preview/PostgresEntityForm";
import NextActionStrip from "@/components/ui/NextActionStrip";
import {
  getPostgresEntityFormReferenceData,
  getPostgresPreviewCompanyById,
  listPostgresCompanyOperatingAssetLinks,
  listPostgresCompanyProjectLinks,
  listPostgresCompanyRelationships,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type FormData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getPostgresEntityFormReferenceData>>;
      company: NonNullable<Awaited<ReturnType<typeof getPostgresPreviewCompanyById>>>;
      projectLinks: Awaited<ReturnType<typeof listPostgresCompanyProjectLinks>>;
      operatingAssetLinks: Awaited<
        ReturnType<typeof listPostgresCompanyOperatingAssetLinks>
      >;
      relationships: Awaited<ReturnType<typeof listPostgresCompanyRelationships>>;
    }
  | {
      ok: false;
      error: string;
    };

async function getFormData(companyId: string): Promise<FormData> {
  try {
    const [
      referenceData,
      company,
      projectLinks,
      operatingAssetLinks,
      relationships,
    ] = await Promise.all([
      getPostgresEntityFormReferenceData(),
      getPostgresPreviewCompanyById(companyId),
      listPostgresCompanyProjectLinks(companyId),
      listPostgresCompanyOperatingAssetLinks(companyId),
      listPostgresCompanyRelationships(companyId),
    ]);

    if (!company) {
      return { ok: false, error: "not_found" };
    }

    return {
      ok: true,
      referenceData,
      company,
      projectLinks,
      operatingAssetLinks,
      relationships,
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
        Company editing writes to Railway PostgreSQL staging. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function EditPostgresCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getFormData(id);

  if (!data.ok && data.error === "not_found") {
    return <NotFoundNotice label="Company" backHref="/postgres-preview" />;
  }

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href={`/postgres-preview/companies/${id}`}
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Company
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                Edit Company
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                Update the staging company profile. Draft saves remain allowed
                while source evidence, project/asset roles, ownership links,
                and group relationships are completed through the saved detail
                workflow.
              </p>
            </div>
            {data.ok ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                <StatusBadge value={data.company.entity_type_code} />
                <StatusBadge value={data.company.company_type_primary_code} />
                <StatusBadge
                  domain="review"
                  value={data.company.review_status_code}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <NextActionStrip
        description="While editing a company, keep the saved profile, source creation, and operational review queue close so classification edits stay tied to relationship and evidence governance."
        actions={[
          {
            label: "Company Profile",
            title: "Back to company record",
            description:
              "Return to readiness, evidence, portfolio roles, relationships, and export checks.",
            href: `/postgres-preview/companies/${id}`,
          },
          {
            label: "Evidence",
            title: "Add source evidence",
            description:
              "Create a source record with this company preselected as the linked target.",
            href: `/sources/new?entityType=company&entityId=${id}`,
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
        <PostgresCompanyForm
          company={data.company}
          mode="edit"
          relationshipPreview={{
            projectLinks: data.projectLinks,
            operatingAssetLinks: data.operatingAssetLinks,
            relationships: data.relationships,
          }}
          referenceData={data.referenceData}
        />
      )}
    </main>
  );
}
