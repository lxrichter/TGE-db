import Link from "next/link";
import { PostgresCompanyForm } from "@/components/postgres-preview/PostgresEntityForm";
import NextActionStrip from "@/components/ui/NextActionStrip";
import { getPostgresEntityFormReferenceData } from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type FormData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getPostgresEntityFormReferenceData>>;
    }
  | {
      ok: false;
      error: string;
    };

async function getFormData(): Promise<FormData> {
  try {
    const referenceData = await getPostgresEntityFormReferenceData();
    return { ok: true, referenceData };
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
        Company creation writes to Railway PostgreSQL staging. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function NewPostgresCompanyPage() {
  const data = await getFormData();

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href="/postgres-preview"
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Command Center
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Entity Workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
            Add Company
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
            Create a company draft. Draft saving is allowed while source
            evidence, project/plant roles, ownership structures, and group
            relationships are completed in the saved detail workflow.
          </p>
        </div>
      </section>

      <NextActionStrip
        title="After Save"
        description="Save the draft first, then continue through the company worklist, evidence backbone, or Research Ops."
        actions={[
          {
            label: "Worklist",
            title: "Open Companies",
            description:
              "Return to company filters, missing-data queues, and exportable lists.",
            href: "/postgres-preview/companies",
          },
          {
            label: "Evidence",
            title: "Open Sources",
            description: "Review governed sources, article matches, and evidence links.",
            href: "/sources",
          },
          {
            label: "Operations",
            title: "Open Research Ops",
            description:
              "Review source gaps, validation queues, missing data, and assignments.",
            href: "/postgres-preview/research-ops",
          },
        ]}
      />

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <PostgresCompanyForm mode="create" referenceData={data.referenceData} />
      )}
    </main>
  );
}
