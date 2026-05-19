import Link from "next/link";
import { getServerSession } from "next-auth";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
import ArticleFactCandidatesClient from "@/components/sources/ArticleFactCandidatesClient";
import SourceMatchCandidatesClient from "@/components/sources/SourceMatchCandidatesClient";
import SourceStatusActions from "@/components/sources/SourceStatusActions";
import { authOptions } from "@/lib/auth/auth";
import { canReview, type UserRole } from "@/lib/auth/roles";
import { listPostgresFieldSuggestionCandidatesForSource } from "@/lib/postgres-preview";
import {
  countSourceMatchCandidates,
  getSourceById,
  listSourceMatchCandidates,
  type SourceDetail,
  type SourceLink,
} from "@/lib/services/sources";
import {
  countArticleFactCandidates,
  listArticleFactCandidates,
} from "@/lib/services/article-facts";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

type BadgeTone = "green" | "amber" | "red" | "neutral";

type SourceDetailData =
  | {
      ok: true;
      source: SourceDetail | null;
    }
  | {
      ok: false;
      error: string;
    };

async function getSourceDetailData(id: string): Promise<SourceDetailData> {
  try {
    const source = await getSourceById(id);
    return { ok: true, source };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusTone(status: string): BadgeTone {
  if (status === "credible") {
    return "green";
  }

  if (status === "needs_review" || status === "outdated") {
    return "amber";
  }

  if (status === "weak" || status === "rejected") {
    return "red";
  }

  return "neutral";
}

function visibilityTone(visibility: string): BadgeTone {
  if (visibility === "public") {
    return "green";
  }

  if (visibility === "client_confidential" || visibility === "not_for_publication") {
    return "red";
  }

  return "amber";
}

function formatCode(value: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MW")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bcod\b/gi, "COD");
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string | null;
  tone?: BadgeTone;
}) {
  const classes = {
    green: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  };

  return (
    <span
      className={`inline-flex min-h-[28px] items-center border px-2 text-xs font-semibold ${classes[tone]}`}
    >
      {label || "Unknown"}
    </span>
  );
}

function WorkflowStep({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note: string;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="inline-flex h-7 min-w-7 items-center justify-center border border-[#b9d98b] bg-[#f1f8e8] px-2 text-xs font-bold text-[#3f6f19]">
        {step}
      </div>
      <div className="mt-3 text-sm font-bold text-[#1f2937]">{title}</div>
      <p className="mt-2 text-xs leading-5 text-gray-500">{note}</p>
    </div>
  );
}

function StatusTile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone?: BadgeTone;
}) {
  const accents = {
    green: "border-l-[#8dc63f]",
    amber: "border-l-amber-300",
    red: "border-l-red-300",
    neutral: "border-l-gray-300",
  };

  return (
    <div
      className={`border border-l-4 border-gray-200 bg-white px-4 py-4 ${accents[tone]}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-[#1f2937]">{value || "-"}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function entityHref(link: SourceLink) {
  if (link.entity_type === "project") {
    return `/postgres-preview/projects/${link.entity_id}`;
  }

  if (link.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${link.entity_id}`;
  }

  return `/postgres-preview/companies/${link.entity_id}`;
}

function entityTypeLabel(value: SourceLink["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant / Facility";
  }

  if (value === "project") {
    return "Project";
  }

  return "Company";
}

function LinkedEntityTable({ links }: { links: SourceLink[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] table-fixed text-left text-sm">
        <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-[14%] px-4 py-3 font-semibold">Entity</th>
            <th className="w-[24%] px-4 py-3 font-semibold">Record</th>
            <th className="w-[11%] px-4 py-3 font-semibold">Country</th>
            <th className="w-[14%] px-4 py-3 font-semibold">Evidence</th>
            <th className="w-[18%] px-4 py-3 font-semibold">Claim / Value</th>
            <th className="w-[10%] px-4 py-3 font-semibold">Confidence</th>
            <th className="w-[9%] px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {links.map((link) => (
            <tr key={link.entity_source_id} className="align-top">
              <td className="px-4 py-3 text-gray-700">
                {entityTypeLabel(link.entity_type)}
              </td>
              <td className="px-4 py-3">
                <Link
                  className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  href={entityHref(link)}
                >
                  {link.entity_name || "Unnamed record"}
                </Link>
                <div className="mt-1 text-xs text-gray-500">
                  {link.legacy_id || link.entity_id}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">{link.country || "-"}</td>
              <td className="px-4 py-3 text-gray-700">
                <div className="font-medium text-[#1f2937]">
                  {formatCode(link.evidence_type)}
                </div>
                {link.evidence_note ? (
                  <div className="mt-2 text-xs leading-5 text-gray-500">
                    {link.evidence_note}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-gray-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {formatCode(link.linked_field)}
                </div>
                {link.extracted_value ? (
                  <div className="mt-1 font-semibold text-[#1f2937]">
                    {link.extracted_value}
                  </div>
                ) : null}
                {link.claim_text ? (
                  <div className="mt-2 text-xs leading-5 text-gray-500">
                    {link.claim_text}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Badge label={formatCode(link.confidence_status_code)} />
                {link.is_primary_evidence ? (
                  <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                    Primary evidence
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {formatDateTime(link.updated_at)}
              </td>
            </tr>
          ))}

          {links.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                This source is not linked to project, plant/facility, or company
                records yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This source profile reads from Railway PostgreSQL. Run the app through
        Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL` locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSourceDetailData(id);

  if (!data.ok) {
    return (
      <main className="space-y-6">
        <SetupNotice error={data.error} />
        <Link href="/sources" className="text-sm font-semibold text-[#4f7f1f]">
          Back to Sources / Documents
        </Link>
      </main>
    );
  }

  if (!data.source) {
    return (
      <main className="space-y-6">
        <section className="border border-gray-200 bg-white p-8">
          <p className="text-base text-gray-700">Source not found.</p>
          <Link
            href="/sources"
            className="mt-4 inline-block text-sm font-semibold text-[#4f7f1f]"
          >
            Back to Sources / Documents
          </Link>
        </section>
      </main>
    );
  }

  const source = data.source;
  const sourceTitle =
    source.title || source.url || source.source_reference || "Untitled source";
  const [
    session,
    sourceMatchCandidates,
    articleFactCandidates,
    openSourceMatchCount,
    openArticleFactCount,
    fieldSuggestionCandidates,
  ] = await Promise.all([
    getServerSession(authOptions),
    listSourceMatchCandidates({ sourceId: source.source_id, limit: 25 }),
    listArticleFactCandidates({ sourceId: source.source_id, limit: 25 }),
    countSourceMatchCandidates({
      sourceId: source.source_id,
      openOnly: true,
    }),
    countArticleFactCandidates({
      sourceId: source.source_id,
      openOnly: true,
    }),
    listPostgresFieldSuggestionCandidatesForSource(source.source_id),
  ]);
  const sessionUser = session?.user as
    | { role?: UserRole | string | null }
    | undefined;
  const canReviewSource = canReview(sessionUser?.role);
  const openFieldSuggestionCount = fieldSuggestionCandidates.filter(
    (candidate) =>
      !candidate.applied_at &&
      !["confirmed", "rejected", "superseded"].includes(
        candidate.suggestion_status_code
      )
  ).length;

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
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Source Profile
              </p>
              <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[#1f2937]">
                {sourceTitle}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Operational evidence workspace for source metadata, credibility
                review, entity links, extracted fact candidates, and audited
                field suggestions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                label={source.visibility_label || source.visibility_code}
                tone={visibilityTone(source.visibility_code)}
              />
              <Badge
                label={
                  source.credibility_status_label ||
                  source.credibility_status_code
                }
                tone={statusTone(source.credibility_status_code)}
              />
              <Link
                href={`/sources/${source.source_id}/edit`}
                className="inline-flex min-h-[28px] items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              >
                Edit Source
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <WorkflowStep
          step="1"
          title="Source Record"
          note="Imported or manually added metadata, URL/reference, visibility, and source type."
        />
        <WorkflowStep
          step="2"
          title="Credibility Review"
          note="Editors mark whether the source is credible, weak, outdated, rejected, or still pending."
        />
        <WorkflowStep
          step="3"
          title="Evidence Link"
          note="Confirmed links connect this source to projects, plants/facilities, or companies."
        />
        <WorkflowStep
          step="4"
          title="Fact / Candidate"
          note="Extracted facts and AI field suggestions stay reviewable before they affect records."
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatusTile
          label="Credibility"
          value={
            <span className="text-xl">
              {source.credibility_status_label ||
                formatCode(source.credibility_status_code)}
            </span>
          }
          note="Current source review state"
          tone={statusTone(source.credibility_status_code)}
        />
        <StatusTile
          label="Visibility"
          value={
            <span className="text-xl">
              {source.visibility_label || formatCode(source.visibility_code)}
            </span>
          }
          note="Controls future export/subscriber exposure"
          tone={visibilityTone(source.visibility_code)}
        />
        <StatusTile
          label="Evidence Links"
          value={formatCount(source.linked_entity_count)}
          note="Confirmed source-to-record relationships"
          tone={source.linked_entity_count > 0 ? "green" : "amber"}
        />
        <StatusTile
          label="Open Matches"
          value={formatCount(openSourceMatchCount)}
          note="Article/entity candidates needing review"
          tone={openSourceMatchCount > 0 ? "amber" : "neutral"}
        />
        <StatusTile
          label="Open Facts"
          value={formatCount(openArticleFactCount)}
          note="Extracted fact candidates not finalized"
          tone={openArticleFactCount > 0 ? "amber" : "neutral"}
        />
        <StatusTile
          label="AI Suggestions"
          value={formatCount(openFieldSuggestionCount)}
          note="Reviewable field suggestions"
          tone={openFieldSuggestionCount > 0 ? "amber" : "neutral"}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DetailField
          label="Source Type"
          value={source.source_type_label || source.source_type_code}
        />
        <DetailField label="Country" value={source.country || "-"} />
        <DetailField label="Published" value={formatDate(source.published_date)} />
        <DetailField label="Accessed" value={formatDateTime(source.accessed_at)} />
        <DetailField
          label="Linked Records"
          value={formatCount(source.linked_entity_count)}
        />
      </section>

      <Section title="Reference">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DetailField
            label="URL"
            value={
              source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-semibold text-[#4f7f1f] hover:underline"
                >
                  {source.url}
                </a>
              ) : (
                "-"
              )
            }
          />
          <DetailField
            label="Reference"
            value={source.source_reference || source.publisher || "-"}
          />
          <DetailField
            label="Author / Organization"
            value={source.author_organization || "-"}
          />
          <DetailField label="Language" value={source.language_code || "-"} />
        </div>
      </Section>

      <Section title="Summary And Notes">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DetailField
            label="Extracted Summary"
            value={source.extracted_summary || "No extracted summary added yet."}
          />
          <DetailField
            label="Relevant Excerpt"
            value={source.relevant_excerpt || "No excerpt added yet."}
          />
          <DetailField label="Internal Notes" value={source.notes || "No notes added."} />
          <DetailField
            label="Attachment"
            value={
              source.attachment_url ? (
                <a
                  href={source.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-semibold text-[#4f7f1f] hover:underline"
                >
                  {source.attachment_url}
                </a>
              ) : (
                "No attachment URL added."
              )
            }
          />
        </div>
      </Section>

      <Section title="Linked Evidence">
        <div className="mb-4 grid gap-3 text-sm text-gray-600 lg:grid-cols-3">
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="font-semibold text-[#1f2937]">Evidence link</div>
            <p className="mt-1 text-xs leading-5">
              A confirmed relationship between this source and a database
              record. It does not automatically change fields.
            </p>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="font-semibold text-[#1f2937]">Claim context</div>
            <p className="mt-1 text-xs leading-5">
              Linked field, extracted value, and evidence note explain what the
              source supports.
            </p>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="font-semibold text-[#1f2937]">Primary evidence</div>
            <p className="mt-1 text-xs leading-5">
              Primary evidence can later drive export readiness and confidence
              scoring.
            </p>
          </div>
        </div>
        <LinkedEntityTable links={source.links} />
      </Section>

      <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />

      <ArticleFactCandidatesClient
        canReview={canReviewSource}
        candidates={articleFactCandidates}
      />

      <PostgresFieldSuggestionsPanel
        canReviewStatus={canReviewSource}
        candidates={fieldSuggestionCandidates}
        showEntity
      />

      {canReviewSource ? (
        <SourceStatusActions
          sourceId={source.source_id}
          currentStatus={source.credibility_status_code}
        />
      ) : null}

      <Section title="Review Metadata">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <DetailField label="Added By" value={source.added_by_name || "Unknown"} />
          <DetailField label="Reviewed By" value={source.reviewed_by_name || "-"} />
          <DetailField label="Created" value={formatDateTime(source.created_at)} />
          <DetailField label="Updated" value={formatDateTime(source.updated_at)} />
        </div>
      </Section>
    </main>
  );
}
