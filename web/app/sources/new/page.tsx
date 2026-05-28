import Link from "next/link";
import SourceForm from "@/components/sources/SourceForm";
import NextActionStrip from "@/components/ui/NextActionStrip";
import { getSourceFormReferenceData } from "@/lib/services/sources";
import type { SourceLink } from "@/lib/services/sources";

export const dynamic = "force-dynamic";

type SourceNewData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getSourceFormReferenceData>>;
    }
  | {
      ok: false;
      error: string;
    };

type NewSourceSearchParams = {
  entityType?: string;
  entityId?: string;
};

async function getSourceNewData(): Promise<SourceNewData> {
  try {
    const referenceData = await getSourceFormReferenceData();
    return { ok: true, referenceData };
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
        Source creation currently writes to Railway PostgreSQL. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-[var(--tge-governance-attention-text)]">
        Error: {error}
      </p>
    </section>
  );
}

function targetHref(target: {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
}) {
  if (target.entity_type === "project") {
    return `/postgres-preview/projects/${target.entity_id}`;
  }

  if (target.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${target.entity_id}`;
  }

  return `/postgres-preview/companies/${target.entity_id}`;
}

function targetTypeLabel(value: SourceLink["entity_type"]) {
  if (value === "operating_asset") {
    return "plant";
  }

  return value;
}

export default async function NewSourcePage({
  searchParams,
}: {
  searchParams?: Promise<NewSourceSearchParams>;
}) {
  const data = await getSourceNewData();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialLinkTarget = data.ok
    ? data.referenceData.linkTargets.find(
        (target) =>
          target.entity_type ===
            (resolvedSearchParams.entityType as SourceLink["entity_type"]) &&
          target.entity_id === resolvedSearchParams.entityId
      )
    : null;

  return (
    <main className="space-y-8">
      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <Link
            href="/sources"
            className="text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:underline"
          >
            Back to Sources / Documents
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            Sources / Documents
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
            Add Source
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-text-secondary)]">
            {initialLinkTarget ? (
              <>
                Add a governed source/evidence entry and link it to{" "}
                <span className="font-semibold text-[var(--tge-text-primary)]">
                  {initialLinkTarget.label}
                </span>{" "}
                after save. The evidence link remains governed separately from
                the project, plant, or company fields.
              </>
            ) : (
              <>
                Add a governed source/evidence entry. Source linking to
                projects, plants, and companies is available after
                the source has been created.
              </>
            )}
          </p>
        </div>
      </section>

      <NextActionStrip
        title={initialLinkTarget ? "Creation Context" : "After Save"}
        description={
          initialLinkTarget
            ? "This source was opened from an entity page. Keep the target, evidence registry, and review work nearby."
            : "Create the source first, then continue through review, matching, or fact triage."
        }
        actions={
          initialLinkTarget
            ? [
                {
                  label: "Target",
                  title: `Back to ${targetTypeLabel(
                    initialLinkTarget.entity_type
                  )}`,
                  description:
                    "Return to the entity that requested this source evidence.",
                  href: targetHref(initialLinkTarget),
                },
                {
                  label: "Sources & Evidence",
                  title: "Open Sources & Evidence",
                  description:
                    "Review governed sources, credibility, and evidence coverage.",
                  href: "/sources",
                },
                {
                  label: "Matches",
                  title: "Review Article Matches",
                  description:
                    "Review article-to-entity candidates before evidence links.",
                  href: "/sources/matches",
                },
              ]
            : [
                {
                  label: "Sources & Evidence",
                  title: "Open Sources & Evidence",
                  description:
                    "Return to the governed source registry and operations.",
                  href: "/sources",
                },
                {
                  label: "Matches",
                  title: "Review Article Matches",
                  description:
                    "Confirm or reject article-to-entity match candidates.",
                  href: "/sources/matches",
                },
                {
                  label: "Facts",
                  title: "Review Article Facts",
                  description:
                    "Triage extracted fact candidates before field suggestions or audited apply.",
                  href: "/sources/facts",
                },
              ]
        }
      />

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <SourceForm
          mode="create"
          referenceData={data.referenceData}
          initialLinkTarget={
            initialLinkTarget
              ? {
                  entity_type: initialLinkTarget.entity_type,
                  entity_id: initialLinkTarget.entity_id,
                  label: initialLinkTarget.label,
                }
              : null
          }
        />
      )}
    </main>
  );
}
