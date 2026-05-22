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
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Source creation currently writes to Railway PostgreSQL. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
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
    return "plant / facility";
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
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <Link
            href="/sources"
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Sources / Documents
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Sources / Documents
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
            Add Source
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
            {initialLinkTarget ? (
              <>
                Add a PostgreSQL source/evidence record and link it to{" "}
                <span className="font-semibold text-[#1f2937]">
                  {initialLinkTarget.label}
                </span>{" "}
                after save. The evidence link remains governed separately from
                the project, plant/facility, or company fields.
              </>
            ) : (
              <>
                Add a PostgreSQL source/evidence record. Source linking to
                projects, plants/facilities, and companies is available after
                the source has been created.
              </>
            )}
          </p>
        </div>
      </section>

      <NextActionStrip
        description={
          initialLinkTarget
            ? "This source creation flow was opened from a record. Keep the target record, evidence backbone, and review queues close while adding source evidence."
            : "Create the source record first, then return to evidence governance, entity matching, or fact review when the source is ready for review."
        }
        actions={
          initialLinkTarget
            ? [
                {
                  label: "Linked Target",
                  title: `Back to ${targetTypeLabel(
                    initialLinkTarget.entity_type
                  )}`,
                  description:
                    "Return to the record that requested this source evidence.",
                  href: targetHref(initialLinkTarget),
                },
                {
                  label: "Evidence Backbone",
                  title: "Open Sources",
                  description:
                    "Review source records, credibility states, and linked evidence coverage.",
                  href: "/sources",
                },
                {
                  label: "Review Work",
                  title: "Article matches",
                  description:
                    "Review article-to-entity candidates before evidence links are confirmed.",
                  href: "/sources/matches",
                },
              ]
            : [
                {
                  label: "Evidence Backbone",
                  title: "Open Sources",
                  description:
                    "Return to the governed source registry and source operations.",
                  href: "/sources",
                },
                {
                  label: "Entity Matching",
                  title: "Review article matches",
                  description:
                    "Confirm or reject article-to-record match candidates.",
                  href: "/sources/matches",
                },
                {
                  label: "Fact Review",
                  title: "Review article facts",
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
