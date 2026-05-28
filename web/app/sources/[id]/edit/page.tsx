import Link from "next/link";
import SourceForm from "@/components/sources/SourceForm";
import NextActionStrip from "@/components/ui/NextActionStrip";
import {
  getSourceById,
  getSourceFormReferenceData,
} from "@/lib/services/sources";

export const dynamic = "force-dynamic";

type SourceEditData =
  | {
      ok: true;
      source: Awaited<ReturnType<typeof getSourceById>>;
      referenceData: Awaited<ReturnType<typeof getSourceFormReferenceData>>;
    }
  | {
      ok: false;
      error: string;
    };

async function getSourceEditData(id: string): Promise<SourceEditData> {
  try {
    const [source, referenceData] = await Promise.all([
      getSourceById(id),
      getSourceFormReferenceData(),
    ]);
    return { ok: true, source, referenceData };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5">
      <h2 className="text-lg font-bold text-[var(--tge-governance-attention-text)]">
        PostgreSQL Not Connected
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
        Source editing currently writes to Railway PostgreSQL. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-[var(--tge-governance-attention-text)]">
        Error: {error}
      </p>
    </section>
  );
}

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSourceEditData(id);

  return (
    <main className="space-y-8">
      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <Link
            href={`/sources/${id}`}
            className="text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:underline"
          >
            Back to Source Profile
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            Sources / Documents
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
            Edit Source
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-text-secondary)]">
            Edit source metadata and manage entity-level evidence links for the
            governed source backbone.
          </p>
        </div>
      </section>

      <NextActionStrip
        title="Editing Context"
        description="Keep the source profile, matches, and fact candidates close while editing."
        actions={[
          {
            label: "Profile",
            title: "Open Source Profile",
            description: "Review credibility, linked entities, facts, and lifecycle state.",
            href: `/sources/${id}`,
          },
          {
            label: "Matches",
            title: "Review Source Matches",
            description: "Open article-to-entity candidates filtered to this source.",
            href: `/sources/matches?sourceId=${id}`,
          },
          {
            label: "Facts",
            title: "Review Source Facts",
            description: "Open extracted fact candidates filtered to this source.",
            href: `/sources/facts?sourceId=${id}`,
          },
        ]}
      />

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : !data.source ? (
        <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-8">
          <p className="text-base text-[var(--tge-governance-neutral-text)]">
            Source not found.
          </p>
          <Link
            href="/sources"
            className="mt-4 inline-block text-sm font-semibold text-[var(--tge-brand-green-dark)]"
          >
            Back to Sources / Documents
          </Link>
        </section>
      ) : (
        <SourceForm
          mode="edit"
          source={data.source}
          referenceData={data.referenceData}
        />
      )}
    </main>
  );
}
