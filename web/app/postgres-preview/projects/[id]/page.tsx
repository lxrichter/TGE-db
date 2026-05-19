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
import {
  fieldSuggestionCounts,
  formatGovernanceCode,
  GovernanceBadge,
  GovernanceEvidenceSnapshot,
  GovernanceLifecyclePanel,
  GovernanceSignalCard,
  openResearchIssues,
  reviewStatusTone,
  signalTone,
  type GovernanceLifecycleStep,
} from "@/components/postgres-preview/PostgresGovernanceOverview";
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

function metric(value: number | null, suffix: string) {
  return value === null || value === undefined ? "-" : `${formatMw(value)} ${suffix}`;
}

function dateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
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
  ] satisfies GovernanceLifecycleStep[];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <GovernanceSignalCard
            label="Classification"
            value={formatGovernanceCode(project.primary_use_type_code)}
            note={`${formatGovernanceCode(project.lifecycle_phase_code)} · ${
              project.country || "No country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <GovernanceBadge label={project.project_group || "No project group"} />
          </GovernanceSignalCard>
          <GovernanceSignalCard
            label="Evidence"
            value={`${formatCount(credibleSources.length)}/${formatCount(
              sources.length
            )}`}
            note="Credible linked sources"
            tone={sources.length > 0 && credibleSources.length > 0 ? "green" : "red"}
          >
            <GovernanceBadge
              label={`${formatCount(openSourceMatchCount)} open match${
                openSourceMatchCount === 1 ? "" : "es"
              }`}
              tone={openSourceMatchCount > 0 ? "amber" : "neutral"}
            />
          </GovernanceSignalCard>
          <GovernanceSignalCard
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
            <GovernanceBadge
              label={formatGovernanceCode(project.review_status_code)}
              tone={reviewStatusTone(project.review_status_code)}
            />
          </GovernanceSignalCard>
          <GovernanceSignalCard
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
              <GovernanceBadge
                label={`${formatCount(fieldSuggestionSummary.applyReady)} ready to apply`}
                tone="amber"
              />
            ) : null}
          </GovernanceSignalCard>
        </section>

        <GovernanceEvidenceSnapshot
          description="Confirmed source links supporting this project. Source credibility and evidence confidence stay separate from project field updates."
          emptyMessage="This project cannot be treated as export-ready until at least one source is linked and reviewed."
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <GovernanceLifecyclePanel
        description="Operational position of this project record across identity, evidence, validation, and AI-assisted review."
        steps={lifecycleSteps}
        title="Project Workflow State"
      />
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
