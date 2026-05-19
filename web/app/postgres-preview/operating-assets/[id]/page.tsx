import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canReview } from "@/lib/auth/roles";
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
import { OperatingAssetCompanyLinksPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
import PostgresReviewStatusActions from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresResearchIssuesPanel from "@/components/postgres-preview/PostgresResearchIssuesPanel";
import PostgresSourceEvidencePanel from "@/components/postgres-preview/PostgresSourceEvidencePanel";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
import SourceMatchCandidatesClient from "@/components/sources/SourceMatchCandidatesClient";
import {
  getPostgresCompanyRelationshipReferenceData,
  getPostgresEntityFormReferenceData,
  getPostgresPreviewOperatingAssetById,
  getPostgresResearchOpsIssueReferenceData,
  listPostgresAuditEventsForEntity,
  listPostgresFieldSuggestionCandidatesForEntity,
  listPostgresOperatingAssetCompanyLinks,
  listPostgresResearchOpsIssuesForEntity,
  type PostgresAuditEvent,
  type PostgresEntitySourceLink,
  type PostgresFieldSuggestionCandidate,
  type PostgresPreviewOperatingAssetDetail,
  type PostgresResearchOpsIssue,
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

function hasAssetCapacity(asset: PostgresPreviewOperatingAssetDetail) {
  return Boolean(
    asset.electric_capacity_mwe ||
      asset.electric_capacity_running_mwe ||
      asset.thermal_capacity_mwth ||
      asset.potential_min_mwe ||
      asset.potential_max_mwe ||
      asset.annual_power_generation_gwhe ||
      asset.annual_heat_supply_gwhth ||
      asset.annual_cooling_supply_gwhc
  );
}

function getAssetReadinessIssues(
  asset: PostgresPreviewOperatingAssetDetail
): ExportReadinessIssue[] {
  const issues: ExportReadinessIssue[] = [];
  const credibleSourceCount = asset.sources.filter(
    (source) => source.credibility_status_code === "credible"
  ).length;
  const approvedStatuses = new Set(["approved", "export_ready"]);

  if (!approvedStatuses.has(asset.review_status_code)) {
    issues.push({
      severity: "blocker",
      label: "Review status not approved",
      detail:
        "Exports should use approved or export-ready plant/facility records.",
    });
  }

  if (asset.sources.length === 0) {
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

  if (!asset.country) {
    issues.push({
      severity: "blocker",
      label: "Missing country",
      detail: "Country is a critical asset field for exports and analytics.",
    });
  }

  if (!asset.lifecycle_phase_code || asset.lifecycle_phase_code === "unknown") {
    issues.push({
      severity: "blocker",
      label: "Missing operating status",
      detail: "Operating status is required before export-ready use.",
    });
  }

  if (!asset.primary_use_type_code || asset.primary_use_type_code === "unknown") {
    issues.push({
      severity: "blocker",
      label: "Missing use type",
      detail: "Power/direct-use/hybrid classification is required.",
    });
  }

  if (!hasAssetCapacity(asset)) {
    issues.push({
      severity: "warning",
      label: "Missing capacity/output",
      detail: "Capacity can be overridden by editors, but should be flagged.",
    });
  }

  if (asset.latitude === null || asset.longitude === null) {
    issues.push({
      severity: "warning",
      label: "Missing coordinates",
      detail: "This asset cannot appear on coordinate-confirmed map layers.",
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

function AssetSignalCard({
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

function AssetLifecyclePanel({
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
        <h2 className="text-lg font-bold text-[#1f2937]">Asset Workflow State</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Operational position of this plant/facility across identity,
          operating status, evidence, validation, and AI-assisted review.
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

function AssetEvidenceSnapshot({
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
            Confirmed source links supporting this plant/facility. Source
            credibility and evidence confidence stay separate from asset field
            updates.
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
              This plant/facility cannot be treated as export-ready until at
              least one source is linked and reviewed.
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

function AssetGovernanceOverview({
  asset,
  readinessIssues,
  researchIssues,
  sources,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  auditEvents,
}: {
  asset: PostgresPreviewOperatingAssetDetail;
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
    asset.asset_name &&
      asset.country &&
      asset.lifecycle_phase_code &&
      asset.lifecycle_phase_code !== "unknown" &&
      asset.primary_use_type_code &&
      asset.primary_use_type_code !== "unknown"
  );
  const lifecycleSteps = [
    {
      title: "Asset identity",
      state: identityComplete ? "complete" : "attention",
      note: identityComplete
        ? "Core plant/facility identity, country, status, and use type are present."
        : "Core identity fields need attention before export-ready use.",
    },
    {
      title: "Operating capacity",
      state: hasAssetCapacity(asset) ? "complete" : "attention",
      note: hasAssetCapacity(asset)
        ? "At least one capacity or output value is present."
        : "Capacity/output is missing or still needs confirmation.",
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
            : "No AI field suggestion workflow is active for this asset.",
    },
  ] satisfies Array<{ title: string; state: LifecycleState; note: string }>;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AssetSignalCard
            label="Operating Status"
            value={formatCode(asset.lifecycle_phase_code)}
            note={`${formatCode(asset.primary_use_type_code)} · ${
              asset.country || "No country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <TinyBadge label={asset.project_group || "No plant/field group"} />
          </AssetSignalCard>
          <AssetSignalCard
            label="Capacity"
            value={
              asset.electric_capacity_running_mwe
                ? metric(asset.electric_capacity_running_mwe, "MWe")
                : metric(asset.electric_capacity_mwe, "MWe")
            }
            note={`Thermal ${metric(asset.thermal_capacity_mwth, "MWth")} · COD ${
              asset.cod_year || "-"
            }`}
            tone={hasAssetCapacity(asset) ? "green" : "amber"}
          >
            <TinyBadge label={asset.capacity_estimate_status_code || "unknown"} />
          </AssetSignalCard>
          <AssetSignalCard
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
          </AssetSignalCard>
          <AssetSignalCard
            label="Review / AI"
            value={formatCount(openIssues.length)}
            note={`${formatCount(blockers.length)} export blocker${
              blockers.length === 1 ? "" : "s"
            } · ${formatCount(
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady
            )} AI review`}
            tone={signalTone({
              blockers: blockers.length + criticalIssues.length,
              warnings:
                warnings.length +
                openIssues.length +
                fieldSuggestionSummary.open +
                fieldSuggestionSummary.applyReady,
              complete: true,
            })}
          >
            <TinyBadge
              label={formatCode(asset.review_status_code)}
              tone={reviewTone(asset.review_status_code)}
            />
            <TinyBadge
              label={`${formatCount(auditEvents.length)} audit event${
                auditEvents.length === 1 ? "" : "s"
              }`}
            />
          </AssetSignalCard>
        </section>

        <AssetEvidenceSnapshot
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <AssetLifecyclePanel steps={lifecycleSteps} />
    </section>
  );
}

export default async function PostgresOperatingAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    asset,
    companyLinks,
    relationshipReferenceData,
    entityReferenceData,
    researchIssues,
    issueReferenceData,
    sourceOptions,
    sourceReferenceData,
    fieldSuggestionCandidates,
    sourceMatchCandidates,
    openSourceMatchCount,
    auditEvents,
    session,
  ] =
    await Promise.all([
      getPostgresPreviewOperatingAssetById(id),
      listPostgresOperatingAssetCompanyLinks(id),
      getPostgresCompanyRelationshipReferenceData(),
      getPostgresEntityFormReferenceData(),
      listPostgresResearchOpsIssuesForEntity("operating_asset", id),
      getPostgresResearchOpsIssueReferenceData(),
      listSources({ limit: 250 }),
      getSourceFormReferenceData(),
      listPostgresFieldSuggestionCandidatesForEntity("operating_asset", id),
      listSourceMatchCandidates({
        entityType: "operating_asset",
        entityId: id,
        limit: 12,
        openOnly: true,
      }),
      countSourceMatchCandidates({
        entityType: "operating_asset",
        entityId: id,
        openOnly: true,
      }),
      listPostgresAuditEventsForEntity("operating_asset", id),
      getServerSession(authOptions),
    ]);

  if (!asset) {
    return <NotFoundNotice label="Operating asset" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const readinessIssues = getAssetReadinessIssues(asset);

  return (
    <DetailShell
      eyebrow="PostgreSQL Plant / Facility"
      title={asset.asset_name}
      subtitle="PostgreSQL staging operating asset profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
      badges={
        <>
          <Link
            href={`/postgres-preview/operating-assets/${asset.operating_asset_id}/edit`}
            className="inline-flex min-h-[28px] items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Edit
          </Link>
          <StatusBadge value={asset.primary_use_type_code} />
          <StatusBadge value={asset.lifecycle_phase_code} />
          <StatusBadge value={asset.review_status_code} />
        </>
      }
      stats={[
        {
          label: "Installed Power",
          value: metric(asset.electric_capacity_mwe, "MWe"),
          note: "Installed capacity",
        },
        {
          label: "Running Power",
          value: metric(asset.electric_capacity_running_mwe, "MWe"),
          note: "Current/running capacity",
        },
        {
          label: "Thermal",
          value: metric(asset.thermal_capacity_mwth, "MWth"),
          note: "Direct-use capacity",
        },
        {
          label: "Sources",
          value: formatCount(asset.source_count),
          note: "Evidence links",
        },
        {
          label: "Updated",
          value: dateOnly(asset.updated_at),
          note: "PostgreSQL timestamp",
        },
      ]}
    >
      <AssetGovernanceOverview
        asset={asset}
        auditEvents={auditEvents}
        fieldSuggestionCandidates={fieldSuggestionCandidates}
        openSourceMatchCount={openSourceMatchCount}
        readinessIssues={readinessIssues}
        researchIssues={researchIssues}
        sources={asset.sources}
      />

      <DetailSection title="Identity And Location">
        <DetailFieldGrid
          fields={[
            { label: "Legacy ID", value: asset.legacy_plant_id },
            { label: "Plant / Field Group", value: asset.project_group },
            { label: "Country", value: asset.country },
            { label: "Region", value: asset.region },
            { label: "World Bank Region", value: asset.wb_region },
            { label: "Location", value: asset.location_text },
            { label: "Latitude", value: asset.latitude },
            { label: "Longitude", value: asset.longitude },
            { label: "Research Status", value: asset.research_status },
          ]}
        />
      </DetailSection>

      <DetailSection title="Resource, Capacity, And Operation">
        <DetailFieldGrid
          fields={[
            { label: "Resource Type", value: asset.resource_type },
            { label: "Resource Temp", value: metric(asset.resource_temp_c, "C") },
            {
              label: "Capacity Confidence",
              value: asset.capacity_estimate_status_code,
            },
            { label: "Output Confidence", value: asset.output_estimate_status_code },
            { label: "COD Year", value: asset.cod_year },
            { label: "COD Month", value: asset.cod_month },
            { label: "COD Raw", value: asset.cod_raw },
            { label: "Units", value: asset.number_of_units },
            { label: "Technology", value: asset.plant_technology },
            { label: "Turbine Supplier", value: asset.turbine_supplier },
            {
              label: "Annual Power",
              value: metric(asset.annual_power_generation_gwhe, "GWh"),
            },
            {
              label: "Annual Heat",
              value: metric(asset.annual_heat_supply_gwhth, "GWhth"),
            },
          ]}
        />
      </DetailSection>

      <PostgresReviewStatusActions
        canReviewStatus={canReview(role)}
        currentStatus={asset.review_status_code}
        entityId={asset.operating_asset_id}
        entityType="operating_asset"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <RelatedTgeNewsPanel
        entityType="operating_asset"
        entityId={asset.operating_asset_id}
        sources={asset.sources}
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
          entityType="operating_asset"
          entityId={asset.operating_asset_id}
          sourceOptions={sourceOptions}
          sources={asset.sources}
        />
      </DetailSection>

      <OperatingAssetCompanyLinksPanel
        links={companyLinks}
        operatingAssetId={asset.operating_asset_id}
        referenceData={relationshipReferenceData}
      />

      <PostgresResearchIssuesPanel
        canManageIssues={canEdit(role)}
        entityId={asset.operating_asset_id}
        entityType="operating_asset"
        issueReferenceData={issueReferenceData}
        issues={researchIssues}
      />

      <AuditTrailPanel events={auditEvents} />

      <ExportReadinessPanel
        issues={readinessIssues}
        sourceCount={asset.sources.length}
        credibleSourceCount={
          asset.sources.filter(
            (source) => source.credibility_status_code === "credible"
          ).length
        }
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {asset.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
