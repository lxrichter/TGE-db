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

const newCompanyPageClass = {
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
    <section className={newCompanyPageClass.warning}>
      <h2 className={`text-lg font-bold ${newCompanyPageClass.warningText}`}>
        PostgreSQL Not Connected
      </h2>
      <p className={`mt-2 max-w-3xl text-sm leading-6 ${newCompanyPageClass.warningText}`}>
        Company creation writes to Railway PostgreSQL staging. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className={`mt-3 text-xs ${newCompanyPageClass.warningText}`}>Error: {error}</p>
    </section>
  );
}

export default async function NewPostgresCompanyPage() {
  const data = await getFormData();

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className={newCompanyPageClass.panel}>
        <div className={newCompanyPageClass.hero}>
          <Link
            href="/postgres-preview"
            className={newCompanyPageClass.link}
          >
            Back to Command Center
          </Link>
          <p className={`mt-4 ${newCompanyPageClass.kicker}`}>
            Entity Workspace
          </p>
          <h1 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${newCompanyPageClass.title}`}>
            Add Company
          </h1>
          <p className={`mt-3 max-w-4xl text-sm leading-6 sm:mt-4 sm:text-base sm:leading-7 ${newCompanyPageClass.body}`}>
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
