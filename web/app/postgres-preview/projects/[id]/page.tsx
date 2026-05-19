import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canPromoteProject, canReview } from "@/lib/auth/roles";
import {
  AuditTrailPanel,
  DetailFieldGrid,
  DetailSection,
  DetailShell,
  ExportReadinessPanel,
  NotFoundNotice,
  RelatedTgeNewsPanel,
  StatusBadge,
  type ExportReadinessIssue,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { ProjectCompanyLinksPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
import PostgresReviewStatusActions from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresProjectPromotionPanel from "@/components/postgres-preview/PostgresProjectPromotionPanel";
import PostgresResearchIssuesPanel from "@/components/postgres-preview/PostgresResearchIssuesPanel";
import PostgresSourceEvidencePanel from "@/components/postgres-preview/PostgresSourceEvidencePanel";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
import SourceMatchCandidatesClient from "@/components/sources/SourceMatchCandidatesClient";
import type {
  PostgresAuditEvent,
  PostgresEntitySourceLink,
  PostgresFieldSuggestionCandidate,
  PostgresPreviewProjectDetail,
  PostgresResearchOpsIssue,
} from "@/lib/postgres-preview";
import {
  getPostgresCompanyRelationshipReferenceData,
  getPostgresEntityFormReferenceData,
  getPostgresPreviewProjectById,
  getPostgresResearchOpsIssueReferenceData,
  listPostgresAuditEventsForEntity,
  listPostgresFieldSuggestionCandidatesForEntity,
  listPostgresPromotedOperatingAssets,
  listPostgresProjectCompanyLinks,
  listPostgresResearchOpsIssuesForEntity,
} from "@/lib/postgres-preview";
import {
  countSourceMatchCandidates,
  getSourceFormReferenceData,
  listSourceMatchCandidates,
  listSources,
} from "@/lib/services/sources";
import { formatCount, formatMw } from "@/lib/format";

export const dynamic = "force-dynamic";

type Tone = "green" | "amber" | "red" | "neutral";

type LifecycleState = "complete" | "attention" | "blocked" | "neutral";

function metric(value: number | null, suffix: string) {
  return value === null || value === undefined ? "-" : `${formatMw(value)} ${suffix}`;
}

function dateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatCode(value: string | null | undefined) {
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

function toneClass(tone: Tone) {
  const classes = {
    green: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  };

  return classes[tone];
}

function reviewTone(status: string | null): Tone {
  if (status === "approved" || status === "export_ready") {
    return "green";
  }

  if (status === "needs_update" || status === "validation") {
    return "amber";
  }

  if (status === "archived") {
    return "red";
  }

  return "neutral";
}

function sourceCredibilityTone(status: string): Tone {
  if (status === "credible") {
    return "green";
  }

  if (status === "weak" || status === "rejected") {
    return "red";
  }

  return "amber";
}

function signalTone({
  blockers,
  warnings,
  complete,
}: {
  blockers?: number;
  warnings?: number;
  complete?: boolean;
}): Tone {
  if ((blockers || 0) > 0) {
    return "red";
  }

  if ((warnings || 0) > 0) {
    return "amber";
  }

  return complete ? "green" : "neutral";
}

function TinyBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={`inline-flex min-h-[26px] items-center border px-2 text-[11px] font-semibold ${toneClass(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

function lifecycleLabel(state: LifecycleState) {
  if (state === "complete") {
    return "Complete";
  }

  if (state === "attention") {
    return "Needs Review";
  }

  if (state === "blocked") {
    return "Blocked";
  }

  return "Not Started";
}

function hasProjectCapacity(project: PostgresPreviewProjectDetail) {
  return Boolean(
    project.electric_capacity_mwe ||
      project.thermal_capacity_mwth ||
      project.potential_min_mwe ||
      project.potential_max_mwe ||
      project.annual_power_generation_gwhe ||
      project.annual_heat_supply_gwhth ||
      project.annual_cooling_supply_gwhc
  );
}

function getProjectReadinessIssues(
  project: PostgresPreviewProjectDetail
): ExportReadinessIssue[] {
  const issues: ExportReadinessIssue[] = [];
  const credibleSourceCount = project.sources.filter(
    (source) => source.credibility_status_code === "credible"
  ).length;
  const approvedStatuses = new Set(["approved", "export_ready"]);

  if (!approvedStatuses.has(project.review_status_code)) {
    issues.push({
      severity: "blocker",
      label: "Review status not approved",
      detail: "Exports should use approved or export-ready project records.",
    });
  }

  if (project.sources.length === 0) {
    issues.push({
      severity: "blocker",
      label: "Missing source evidence",
      detail: "At least one linked source/evidence record is required.",
    });
  } else if (credibleSourceCount === 0) {
    issues.push({
      severity: "blocker",
      label: "No credible source",
      detail: "At least one linked source should be marked credible.",
    });
  }

  if (!project.country) {
    issues.push({
      severity: "blocker",
      label: "Missing country",
      detail: "Country is a critical project field for exports and analytics.",
    });
  }

  if (!project.lifecycle_phase_code || project.lifecycle_phase_code === "unknown") {
    issues.push({
      severity: "blocker",
      label: "Missing lifecycle phase",
      detail: "Lifecycle phase is required before export-ready use.",
    });
  }

  if (!project.primary_use_type_code || project.primary_use_type_code === "unknown") {
    issues.push({
      severity: "blocker",
      label: "Missing use type",
      detail: "Power/direct-use/hybrid classification is required.",
    });
  }

  if (!hasProjectCapacity(project)) {
    issues.push({
      severity: "warning",
      label: "Missing capacity/output",
      detail: "Capacity can be overridden by editors, but should be flagged.",
    });
  }

  if (project.latitude === null || project.longitude === null) {
    issues.push({
      severity: "warning",
      label: "Missing coordinates",
      detail: "This project cannot appear on coordinate-confirmed map layers.",
    });
  }

  return issues;
}

function openResearchIssues(issues: PostgresResearchOpsIssue[]) {
  return issues.filter(
    (issue) =>
      !issue.resolved_at &&
      !["resolved", "closed", "rejected"].includes(issue.issue_status_code)
  );
}

function fieldSuggestionCounts(candidates: PostgresFieldSuggestionCandidate[]) {
  return {
    open: candidates.filter(
      (candidate) =>
        !candidate.applied_at &&
        !["confirmed", "rejected", "superseded"].includes(
          candidate.suggestion_status_code
        )
    ).length,
    applyReady: candidates.filter(
      (candidate) =>
        candidate.suggestion_status_code === "confirmed" && !candidate.applied_at
    ).length,
    applied: candidates.filter((candidate) => Boolean(candidate.applied_at)).length,
  };
}

function ProjectSignalCard({
  label,
  value,
  note,
  tone,
  children,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone: Tone;
  children?: React.ReactNode;
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
      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function ProjectLifecyclePanel({
  steps,
}: {
  steps: Array<{ title: string; state: LifecycleState; note: string }>;
}) {
  const stateTone: Record<LifecycleState, Tone> = {
    complete: "green",
    attention: "amber",
    blocked: "red",
    neutral: "neutral",
  };

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Project Workflow State</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Operational position of this project record across identity,
          evidence, validation, and AI-assisted review.
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_auto] sm:items-start"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-gray-200 bg-[#f7f7f7] text-xs font-bold text-gray-600">
              {index + 1}
            </div>
            <div>
              <div className="font-semibold text-[#1f2937]">{step.title}</div>
              <p className="mt-1 text-xs leading-5 text-gray-500">{step.note}</p>
            </div>
            <TinyBadge label={lifecycleLabel(step.state)} tone={stateTone[step.state]} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectEvidenceSnapshot({
  sources,
  openSourceMatchCount,
}: {
  sources: PostgresEntitySourceLink[];
  openSourceMatchCount: number;
}) {
  const credibleSources = sources.filter(
    (source) => source.credibility_status_code === "credible"
  );
  const tgeArticles = sources.filter(
    (source) => source.source_type_code === "tge_article"
  );
  const primaryEvidence = sources.filter((source) => source.is_primary_evidence);
  const sortedSources = sources
    .slice()
    .sort((a, b) => {
      const aScore =
        (a.is_primary_evidence ? 4 : 0) +
        (a.credibility_status_code === "credible" ? 3 : 0) +
        (a.source_type_code === "tge_article" ? 1 : 0);
      const bScore =
        (b.is_primary_evidence ? 4 : 0) +
        (b.credibility_status_code === "credible" ? 3 : 0) +
        (b.source_type_code === "tge_article" ? 1 : 0);
      return bScore - aScore || b.updated_at.localeCompare(a.updated_at);
    });

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Evidence Backbone</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Confirmed source links supporting this project. Source credibility
            and evidence confidence stay separate from project field updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TinyBadge
            label={`${formatCount(credibleSources.length)}/${formatCount(
              sources.length
            )} credible`}
            tone={credibleSources.length > 0 ? "green" : "amber"}
          />
          <TinyBadge
            label={`${formatCount(openSourceMatchCount)} open match${
              openSourceMatchCount === 1 ? "" : "es"
            }`}
            tone={openSourceMatchCount > 0 ? "amber" : "neutral"}
          />
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_280px]">
        {sources.length === 0 ? (
          <div className="border border-dashed border-red-200 bg-red-50 px-5 py-5">
            <div className="font-semibold text-red-700">No confirmed evidence</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-red-700">
              This project cannot be treated as export-ready until at least one
              source is linked and reviewed.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedSources.slice(0, 4).map((source) => (
              <div
                key={source.entity_source_id}
                className="border border-gray-200 bg-[#fbfbfb] px-4 py-4"
              >
                <Link
                  href={`/sources/${source.source_id}`}
                  className="font-semibold leading-6 text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                >
                  {source.source_title || source.source_reference || "Untitled source"}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  <TinyBadge
                    label={formatCode(source.credibility_status_code)}
                    tone={sourceCredibilityTone(source.credibility_status_code)}
                  />
                  <TinyBadge label={formatCode(source.confidence_status_code)} />
                  {source.is_primary_evidence ? (
                    <TinyBadge label="Primary evidence" tone="green" />
                  ) : null}
                </div>
                <div className="mt-3 text-xs leading-5 text-gray-500">
                  {source.linked_field ? (
                    <div>
                      <span className="font-semibold text-gray-700">Field:</span>{" "}
                      {formatCode(source.linked_field)}
                    </div>
                  ) : null}
                  {source.extracted_value ? (
                    <div>
                      <span className="font-semibold text-gray-700">Value:</span>{" "}
                      {source.extracted_value}
                    </div>
                  ) : null}
                  {source.claim_text ? (
                    <div className="mt-1 line-clamp-2">{source.claim_text}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
          <div className="text-sm font-bold text-[#1f2937]">Evidence Coverage</div>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-3">
              <span>Total sources</span>
              <span className="font-bold text-[#1f2937]">{formatCount(sources.length)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Primary evidence</span>
              <span className="font-bold text-[#1f2937]">
                {formatCount(primaryEvidence.length)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>TGE articles</span>
              <span className="font-bold text-[#1f2937]">
                {formatCount(tgeArticles.length)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Open article matches</span>
              <span className="font-bold text-[#1f2937]">
                {formatCount(openSourceMatchCount)}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Link
              href="/sources/matches"
              className="inline-flex h-9 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            >
              Review Article Matches
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectGovernanceOverview({
  project,
  readinessIssues,
  researchIssues,
  sources,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  auditEvents,
}: {
  project: PostgresPreviewProjectDetail;
  readinessIssues: ExportReadinessIssue[];
  researchIssues: PostgresResearchOpsIssue[];
  sources: PostgresEntitySourceLink[];
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  auditEvents: PostgresAuditEvent[];
}) {
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");
  const openIssues = openResearchIssues(researchIssues);
  const criticalIssues = openIssues.filter((issue) => issue.severity === "critical");
  const credibleSources = sources.filter(
    (source) => source.credibility_status_code === "credible"
  );
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const identityComplete = Boolean(
    project.project_name &&
      project.country &&
      project.lifecycle_phase_code &&
      project.lifecycle_phase_code !== "unknown" &&
      project.primary_use_type_code &&
      project.primary_use_type_code !== "unknown"
  );
  const lifecycleSteps = [
    {
      title: "Project identity",
      state: identityComplete ? "complete" : "attention",
      note: identityComplete
        ? "Core project identity, country, lifecycle, and use type are present."
        : "Core identity fields need attention before export-ready use.",
    },
    {
      title: "Evidence coverage",
      state:
        sources.length > 0 && credibleSources.length > 0
          ? "complete"
          : openSourceMatchCount > 0
            ? "attention"
            : "blocked",
      note:
        sources.length > 0 && credibleSources.length > 0
          ? "At least one credible source is linked."
          : openSourceMatchCount > 0
            ? "Open article matches can strengthen evidence coverage."
            : "No credible linked evidence is available yet.",
    },
    {
      title: "Validation / export readiness",
      state:
        blockers.length > 0
          ? "blocked"
          : warnings.length > 0
            ? "attention"
            : "complete",
      note:
        blockers.length > 0
          ? `${formatCount(blockers.length)} blocker(s) must be resolved.`
          : warnings.length > 0
            ? `${formatCount(warnings.length)} warning(s) remain for editor review.`
            : "No readiness blockers or warnings detected.",
    },
    {
      title: "AI-assisted review",
      state:
        fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0
          ? "attention"
          : fieldSuggestionSummary.applied > 0
            ? "complete"
            : "neutral",
      note:
        fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0
          ? "AI field suggestions are waiting for human review or apply."
          : fieldSuggestionSummary.applied > 0
            ? "At least one AI suggestion has been applied with audit."
            : "No AI field suggestion workflow is active for this project.",
    },
  ] satisfies Array<{ title: string; state: LifecycleState; note: string }>;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ProjectSignalCard
            label="Classification"
            value={formatCode(project.primary_use_type_code)}
            note={`${formatCode(project.lifecycle_phase_code)} · ${
              project.country || "No country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <TinyBadge label={project.project_group || "No project group"} />
          </ProjectSignalCard>
          <ProjectSignalCard
            label="Evidence"
            value={`${formatCount(credibleSources.length)}/${formatCount(
              sources.length
            )}`}
            note="Credible linked sources"
            tone={sources.length > 0 && credibleSources.length > 0 ? "green" : "red"}
          >
            <TinyBadge
              label={`${formatCount(openSourceMatchCount)} open match${
                openSourceMatchCount === 1 ? "" : "es"
              }`}
              tone={openSourceMatchCount > 0 ? "amber" : "neutral"}
            />
          </ProjectSignalCard>
          <ProjectSignalCard
            label="Review Work"
            value={formatCount(openIssues.length)}
            note={`${formatCount(blockers.length)} export blocker${
              blockers.length === 1 ? "" : "s"
            } · ${formatCount(warnings.length)} warning${
              warnings.length === 1 ? "" : "s"
            }`}
            tone={signalTone({
              blockers: blockers.length + criticalIssues.length,
              warnings: warnings.length + openIssues.length,
              complete: true,
            })}
          >
            <TinyBadge
              label={formatCode(project.review_status_code)}
              tone={reviewTone(project.review_status_code)}
            />
          </ProjectSignalCard>
          <ProjectSignalCard
            label="AI / Audit"
            value={formatCount(
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady
            )}
            note={`${formatCount(fieldSuggestionSummary.applied)} applied · ${formatCount(
              auditEvents.length
            )} audit event${auditEvents.length === 1 ? "" : "s"}`}
            tone={
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0
                ? "amber"
                : fieldSuggestionSummary.applied > 0
                  ? "green"
                  : "neutral"
            }
          >
            {fieldSuggestionSummary.applyReady > 0 ? (
              <TinyBadge
                label={`${formatCount(fieldSuggestionSummary.applyReady)} ready to apply`}
                tone="amber"
              />
            ) : null}
          </ProjectSignalCard>
        </section>

        <ProjectEvidenceSnapshot
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <ProjectLifecyclePanel steps={lifecycleSteps} />
    </section>
  );
}

export default async function PostgresProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    project,
    companyLinks,
    relationshipReferenceData,
    entityReferenceData,
    promotedAssets,
    researchIssues,
    issueReferenceData,
    sourceOptions,
    sourceReferenceData,
    fieldSuggestionCandidates,
    sourceMatchCandidates,
    openSourceMatchCount,
    auditEvents,
    session,
  ] = await Promise.all([
    getPostgresPreviewProjectById(id),
    listPostgresProjectCompanyLinks(id),
    getPostgresCompanyRelationshipReferenceData(),
    getPostgresEntityFormReferenceData(),
    listPostgresPromotedOperatingAssets(id),
    listPostgresResearchOpsIssuesForEntity("project", id),
    getPostgresResearchOpsIssueReferenceData(),
    listSources({ limit: 250 }),
    getSourceFormReferenceData(),
    listPostgresFieldSuggestionCandidatesForEntity("project", id),
    listSourceMatchCandidates({
      entityType: "project",
      entityId: id,
      limit: 12,
      openOnly: true,
    }),
    countSourceMatchCandidates({
      entityType: "project",
      entityId: id,
      openOnly: true,
    }),
    listPostgresAuditEventsForEntity("project", id),
    getServerSession(authOptions),
  ]);

  if (!project) {
    return <NotFoundNotice label="Project" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const readinessIssues = getProjectReadinessIssues(project);

  return (
    <DetailShell
      eyebrow="PostgreSQL Project"
      title={project.project_name}
      subtitle="PostgreSQL staging project profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
      badges={
        <>
          <Link
            href={`/postgres-preview/projects/${project.project_id}/edit`}
            className="inline-flex min-h-[28px] items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Edit
          </Link>
          <StatusBadge value={project.primary_use_type_code} />
          <StatusBadge value={project.lifecycle_phase_code} />
          <StatusBadge value={project.review_status_code} />
        </>
      }
      stats={[
        {
          label: "Planned Power",
          value: metric(project.electric_capacity_mwe, "MWe"),
          note: "Structured project capacity",
        },
        {
          label: "Thermal",
          value: metric(project.thermal_capacity_mwth, "MWth"),
          note: "Direct-use capacity",
        },
        {
          label: "Potential",
          value:
            project.potential_min_mwe || project.potential_max_mwe
              ? `${metric(project.potential_min_mwe, "MWe")} - ${metric(
                  project.potential_max_mwe,
                  "MWe"
                )}`
              : "-",
          note: "Potential range",
        },
        {
          label: "Sources",
          value: formatCount(project.source_count),
          note: "Evidence links",
        },
        {
          label: "Updated",
          value: dateOnly(project.updated_at),
          note: "PostgreSQL timestamp",
        },
      ]}
    >
      <ProjectGovernanceOverview
        auditEvents={auditEvents}
        fieldSuggestionCandidates={fieldSuggestionCandidates}
        openSourceMatchCount={openSourceMatchCount}
        project={project}
        readinessIssues={readinessIssues}
        researchIssues={researchIssues}
        sources={project.sources}
      />

      <DetailSection title="Identity And Location">
        <DetailFieldGrid
          fields={[
            { label: "Legacy ID", value: project.legacy_project_id },
            { label: "Project Group", value: project.project_group },
            { label: "Country", value: project.country },
            { label: "Region", value: project.region },
            { label: "World Bank Region", value: project.wb_region },
            { label: "Location", value: project.location_text },
            { label: "Latitude", value: project.latitude },
            { label: "Longitude", value: project.longitude },
            { label: "Research Status", value: project.research_status },
          ]}
        />
      </DetailSection>

      <DetailSection title="Resource, Capacity, And Timeline">
        <DetailFieldGrid
          fields={[
            { label: "Resource Type", value: project.resource_type },
            { label: "Resource Temp", value: metric(project.resource_temp_c, "C") },
            {
              label: "Capacity Confidence",
              value: project.capacity_estimate_status_code,
            },
            { label: "Output Confidence", value: project.output_estimate_status_code },
            { label: "Start Dev Year", value: project.start_dev_year },
            { label: "Target COD Year", value: project.target_cod_year },
            { label: "Target COD Month", value: project.target_cod_month },
            { label: "COD Raw", value: project.cod_raw },
            { label: "Technology", value: project.plant_technology },
            { label: "Turbine Supplier", value: project.turbine_supplier },
            {
              label: "Annual Power",
              value: metric(project.annual_power_generation_gwhe, "GWh"),
            },
            {
              label: "Annual Heat",
              value: metric(project.annual_heat_supply_gwhth, "GWhth"),
            },
          ]}
        />
      </DetailSection>

      <PostgresReviewStatusActions
        canReviewStatus={canReview(role)}
        currentStatus={project.review_status_code}
        entityId={project.project_id}
        entityType="project"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <RelatedTgeNewsPanel
        entityType="project"
        entityId={project.project_id}
        sources={project.sources}
      />

      {sourceMatchCandidates.length > 0 ? (
        <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />
      ) : null}

      <PostgresFieldSuggestionsPanel
        canReviewStatus={canReview(role)}
        candidates={fieldSuggestionCandidates}
      />

      <DetailSection title="Source Evidence">
        <PostgresSourceEvidencePanel
          canManageSources={canEdit(role)}
          confidenceStatuses={sourceReferenceData.confidenceStatuses}
          entityType="project"
          entityId={project.project_id}
          sourceOptions={sourceOptions}
          sources={project.sources}
        />
      </DetailSection>

      <ProjectCompanyLinksPanel
        links={companyLinks}
        projectId={project.project_id}
        referenceData={relationshipReferenceData}
      />

      <PostgresProjectPromotionPanel
        canPromote={canPromoteProject(role)}
        projectId={project.project_id}
        promotedAssets={promotedAssets}
      />

      <PostgresResearchIssuesPanel
        canManageIssues={canEdit(role)}
        entityId={project.project_id}
        entityType="project"
        issueReferenceData={issueReferenceData}
        issues={researchIssues}
      />

      <AuditTrailPanel events={auditEvents} />

      <ExportReadinessPanel
        issues={readinessIssues}
        sourceCount={project.sources.length}
        credibleSourceCount={
          project.sources.filter(
            (source) => source.credibility_status_code === "credible"
          ).length
        }
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {project.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
