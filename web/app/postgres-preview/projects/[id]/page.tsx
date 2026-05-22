import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canPromoteProject, canReview } from "@/lib/auth/roles";
import {
  AuditTrailPanel,
  DetailAnchorNav,
  DetailFieldGrid,
  DetailSection,
  DetailShell,
  DetailWorkflowMap,
  EvidenceWorkflowContext,
  ExportReadinessPanel,
  NotFoundNotice,
  PendingReviewChangesPanel,
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
import PostgresRecordActionHub, {
  PostgresNextRequiredActionStrip,
  type PostgresRecordAction,
} from "@/components/postgres-preview/PostgresRecordActionHub";
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
        description="Operational readiness of this project record across identity, evidence, validation, and AI-assisted review."
        steps={lifecycleSteps}
        title="Project Readiness"
      />
    </section>
  );
}

function ProjectActionHub({
  project,
  readinessIssues,
  researchIssues,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  promotedAssetCount,
  canEditRecord,
  canPromoteRecord,
}: {
  project: PostgresPreviewProjectDetail;
  readinessIssues: ExportReadinessIssue[];
  researchIssues: PostgresResearchOpsIssue[];
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  promotedAssetCount: number;
  canEditRecord: boolean;
  canPromoteRecord: boolean;
}) {
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");
  const openIssues = openResearchIssues(researchIssues);
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const actions: PostgresRecordAction[] = [];

  if (canEditRecord) {
    actions.push({
      label: "Edit Core Fields",
      detail: "Update identity, location, lifecycle, use type, capacity, and notes.",
      href: `/postgres-preview/projects/${project.project_id}/edit`,
      tone: blockers.length > 0 || warnings.length > 0 ? "warning" : "neutral",
      primary: blockers.length > 0,
    });
  }

  actions.push({
    label: project.sources.length === 0 ? "Add Evidence" : "Review Evidence",
    detail:
      project.sources.length === 0
        ? "No source is linked yet. Add evidence before export-ready use."
        : `${formatCount(project.sources.length)} linked source${
            project.sources.length === 1 ? "" : "s"
          }; review credibility and linked fields.`,
    href: "#project-source-evidence",
    tone: project.sources.length === 0 ? "blocker" : "ready",
    primary: project.sources.length === 0,
  });

  if (openSourceMatchCount > 0) {
    actions.push({
      label: "Review Article Matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can support related news and evidence links.`,
      href: "#project-article-matches",
      tone: "warning",
      primary: project.sources.length === 0,
    });
  }

  if (fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0) {
    actions.push({
      label: "Review AI Suggestions",
      detail: `${formatCount(fieldSuggestionSummary.open)} open and ${formatCount(
        fieldSuggestionSummary.applyReady
      )} ready-to-apply field suggestion${
        fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady === 1
          ? ""
          : "s"
      }.`,
      href: "#project-ai-suggestions",
      tone: "warning",
    });
  }

  actions.push({
    label: "Company Links",
    detail:
      "Review developer, owner, operator, supplier, investor, and other structured roles.",
    href: "#project-company-links",
    tone: "neutral",
  });

  actions.push({
    label: promotedAssetCount > 0 ? "Promoted Assets" : "Promotion Review",
    detail:
      promotedAssetCount > 0
        ? `${formatCount(promotedAssetCount)} linked plant/facility promotion${
            promotedAssetCount === 1 ? "" : "s"
          } recorded.`
        : canPromoteRecord
          ? "Use when a project has become an operating plant/facility or unit."
          : "Promotion is editor/admin controlled.",
    href: "#project-promotion",
    tone: promotedAssetCount > 0 ? "ready" : "neutral",
  });

  if (openIssues.length > 0) {
    actions.push({
      label: "Research Issues",
      detail: `${formatCount(openIssues.length)} open persistent issue${
        openIssues.length === 1 ? "" : "s"
      } assigned or tracked for this record.`,
      href: "#project-research-issues",
      tone: "warning",
    });
  }

  actions.push({
    label: "Export Readiness",
    detail:
      blockers.length > 0
        ? `${formatCount(blockers.length)} blocker${
            blockers.length === 1 ? "" : "s"
          } and ${formatCount(warnings.length)} warning${
            warnings.length === 1 ? "" : "s"
          } detected.`
        : warnings.length > 0
          ? `${formatCount(warnings.length)} warning${
              warnings.length === 1 ? "" : "s"
            } left for editor judgment.`
          : "No export-readiness blockers detected.",
    href: "#project-export-readiness",
    tone: blockers.length > 0 ? "blocker" : warnings.length > 0 ? "warning" : "ready",
  });

  return (
    <PostgresRecordActionHub
      actions={actions}
      blockerCount={blockers.length}
      description="Use this as the operational entry point for this project record: fix critical fields, strengthen evidence, review AI suggestions, manage relationships, and check promotion/export readiness."
      title="Project Actions"
      warningCount={warnings.length}
    />
  );
}

function getProjectNextRequiredAction({
  project,
  readinessIssues,
  companyLinkCount,
  openIssueCount,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  canEditRecord,
}: {
  project: PostgresPreviewProjectDetail;
  readinessIssues: ExportReadinessIssue[];
  companyLinkCount: number;
  openIssueCount: number;
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  canEditRecord: boolean;
}): PostgresRecordAction {
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const identityComplete = Boolean(
    project.project_name &&
      project.country &&
      project.lifecycle_phase_code &&
      project.lifecycle_phase_code !== "unknown" &&
      project.primary_use_type_code &&
      project.primary_use_type_code !== "unknown"
  );
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");

  if (project.sources.length === 0) {
    return {
      label: "Add source evidence",
      detail: "This project has no linked source yet. Add evidence before review or export-ready use.",
      href: "#project-source-evidence",
      tone: "blocker",
    };
  }

  if (!identityComplete) {
    return {
      label: "Complete project identity",
      detail: "Confirm country, project phase, and geothermal use category before deeper review.",
      href: canEditRecord
        ? `/postgres-preview/projects/${project.project_id}/edit`
        : "#project-identity-location",
      tone: "warning",
    };
  }

  if (companyLinkCount === 0) {
    return {
      label: "Add company role",
      detail: "Add at least one structured developer, owner, operator, supplier, investor, or related role.",
      href: "#project-company-links",
      tone: "warning",
    };
  }

  if (openSourceMatchCount > 0) {
    return {
      label: "Review article matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can strengthen related news and evidence coverage.`,
      href: "#project-article-matches",
      tone: "warning",
    };
  }

  if (fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0) {
    return {
      label: "Review AI suggestions",
      detail: `${formatCount(
        fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady
      )} field suggestion${
        fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady === 1
          ? ""
          : "s"
      } need human review before any database write.`,
      href: "#project-ai-suggestions",
      tone: "warning",
    };
  }

  if (openIssueCount > 0) {
    return {
      label: "Resolve research issue",
      detail: `${formatCount(openIssueCount)} persistent Research Ops issue${
        openIssueCount === 1 ? "" : "s"
      } remain open for this project.`,
      href: "#project-research-issues",
      tone: "warning",
    };
  }

  if (blockers.length > 0 || warnings.length > 0) {
    return {
      label: blockers.length > 0 ? "Review export blockers" : "Review export warnings",
      detail:
        blockers.length > 0
          ? `${formatCount(blockers.length)} export blocker${
              blockers.length === 1 ? "" : "s"
            } remain.`
          : `${formatCount(warnings.length)} export warning${
              warnings.length === 1 ? "" : "s"
            } remain for editor judgment.`,
      href: "#project-export-readiness",
      tone: blockers.length > 0 ? "blocker" : "warning",
    };
  }

  return {
    label: "Ready for editor review",
    detail: "Core identity, source evidence, company roles, and export-readiness checks are clear on this staging record.",
    href: "#project-export-readiness",
    tone: "ready",
  };
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
  const canEditRecord = canEdit(role);
  const canReviewRecord = canReview(role);
  const canPromoteRecord = canPromoteProject(role);
  const credibleSourceCount = project.sources.filter(
    (source) => source.credibility_status_code === "credible"
  ).length;
  const readinessBlockers = readinessIssues.filter(
    (issue) => issue.severity === "blocker"
  );
  const readinessWarnings = readinessIssues.filter(
    (issue) => issue.severity === "warning"
  );
  const openIssueCount = openResearchIssues(researchIssues).length;
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const identityComplete = Boolean(
    project.project_name &&
      project.country &&
      project.lifecycle_phase_code &&
      project.lifecycle_phase_code !== "unknown" &&
      project.primary_use_type_code &&
      project.primary_use_type_code !== "unknown"
  );
  const nextRequiredAction = getProjectNextRequiredAction({
    canEditRecord,
    companyLinkCount: companyLinks.length,
    fieldSuggestionCandidates,
    openIssueCount,
    openSourceMatchCount,
    project,
    readinessIssues,
  });

  return (
    <DetailShell
      eyebrow="PostgreSQL Project"
      title={project.project_name}
      subtitle="PostgreSQL staging project profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
      statusLegendDescription="Project detail badges separate geothermal use category, development phase, review state, readiness severity, and source confidence."
      statusLegendGroups={["review", "lifecycle", "severity", "source"]}
      statusLegendTitle="Project Status Meaning"
      badges={
        <>
          <Link
            href={`/postgres-preview/projects/${project.project_id}/edit`}
            className="inline-flex min-h-[28px] items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Edit
          </Link>
          <StatusBadge value={project.primary_use_type_code} />
          <StatusBadge domain="lifecycle" value={project.lifecycle_phase_code} />
          <StatusBadge domain="review" value={project.review_status_code} />
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
      <PostgresNextRequiredActionStrip action={nextRequiredAction} />

      <DetailWorkflowMap
        description="Use this sequence to scan the project record: confirm identity, strengthen evidence, check company roles, handle AI/review work, then decide whether the record is export-ready."
        steps={[
          {
            label: "Identity",
            href: "#project-identity-location",
            status: identityComplete ? "complete" : "attention",
            note: identityComplete
              ? "Core project identity, country, lifecycle, and use type are present."
              : "Confirm project name, country, lifecycle phase, and use type.",
            meta: project.country || "No country",
          },
          {
            label: "Evidence",
            href: "#project-source-evidence",
            status:
              credibleSourceCount > 0
                ? "complete"
                : project.sources.length > 0 || openSourceMatchCount > 0
                  ? "attention"
                  : "blocked",
            note:
              credibleSourceCount > 0
                ? "At least one credible source is linked."
                : "Add or review source evidence before export-ready use.",
            meta: `${formatCount(credibleSourceCount)}/${formatCount(
              project.sources.length
            )} credible sources`,
          },
          {
            label: "Companies",
            href: "#project-company-links",
            status: companyLinks.length > 0 ? "complete" : "attention",
            note:
              companyLinks.length > 0
                ? "Structured company roles are linked."
                : "Add developer, owner, operator, supplier, or investor roles.",
            meta: `${formatCount(companyLinks.length)} relationship${
              companyLinks.length === 1 ? "" : "s"
            }`,
          },
          {
            label: "AI / Review",
            href: "#project-ai-suggestions",
            status:
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0 ||
              openIssueCount > 0
                ? "attention"
                : fieldSuggestionSummary.applied > 0
                  ? "complete"
                  : "neutral",
            note:
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady > 0
                ? "Review field suggestions before applying any database writes."
                : "Check Research Ops issues and AI suggestions when present.",
            meta: `${formatCount(openIssueCount)} issue${
              openIssueCount === 1 ? "" : "s"
            } · ${formatCount(
              fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady
            )} AI pending`,
          },
          {
            label: "Export",
            href: "#project-export-readiness",
            status:
              readinessBlockers.length > 0
                ? "blocked"
                : readinessWarnings.length > 0
                  ? "attention"
                  : "complete",
            note:
              readinessBlockers.length > 0
                ? "Resolve blockers before export-ready use."
                : "Review warnings before marking this project export-ready.",
            meta: `${formatCount(readinessBlockers.length)} blocker${
              readinessBlockers.length === 1 ? "" : "s"
            }`,
          },
        ]}
      />

      <ProjectGovernanceOverview
        auditEvents={auditEvents}
        fieldSuggestionCandidates={fieldSuggestionCandidates}
        openSourceMatchCount={openSourceMatchCount}
        project={project}
        readinessIssues={readinessIssues}
        researchIssues={researchIssues}
        sources={project.sources}
      />

      <ProjectActionHub
        canEditRecord={canEditRecord}
        canPromoteRecord={canPromoteRecord}
        fieldSuggestionCandidates={fieldSuggestionCandidates}
        openSourceMatchCount={openSourceMatchCount}
        project={project}
        promotedAssetCount={promotedAssets.length}
        readinessIssues={readinessIssues}
        researchIssues={researchIssues}
      />

      <DetailAnchorNav
        items={[
          {
            label: "Identity",
            href: "#project-identity-location",
            note: "Core identity, location, and research status fields",
          },
          {
            label: "Resource / Timeline",
            href: "#project-resource-timeline",
            note: "Resource, capacity, technology, and COD timing fields",
          },
          {
            label: "TGE News",
            href: "#project-tge-news",
            note: "Confirmed ThinkGeoEnergy article evidence",
          },
          {
            label: "AI Suggestions",
            href: "#project-ai-suggestions",
            note: "Human-reviewed field suggestions from source extraction",
          },
          {
            label: "Evidence",
            href: "#project-source-evidence",
            note: "Source/evidence links and linked field claims",
          },
          {
            label: "Companies",
            href: "#project-company-links",
            note: "Developer, owner, operator, supplier, and investor roles",
          },
          {
            label: "Promotion",
            href: "#project-promotion",
            note: "Project to plant/facility promotion workflow",
          },
          {
            label: "Issues",
            href: "#project-research-issues",
            note: "Persistent Research Ops issues",
          },
          {
            label: "Changes",
            href: "#project-review-changes",
            note: "Changed fields that support review and reapproval",
          },
          {
            label: "Audit",
            href: "#project-audit-trail",
            note: "Governed change history",
          },
          {
            label: "Export",
            href: "#project-export-readiness",
            note: "Preview export-readiness checks",
          },
        ]}
      />

      <DetailSection id="project-identity-location" title="Identity And Location">
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

      <DetailSection
        id="project-resource-timeline"
        title="Resource, Capacity, And Timeline"
      >
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
        canReviewStatus={canReviewRecord}
        currentStatus={project.review_status_code}
        entityId={project.project_id}
        entityType="project"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <EvidenceWorkflowContext
        aiSuggestionsHref="#project-ai-suggestions"
        sourceEvidenceHref="#project-source-evidence"
        tgeNewsHref="#project-tge-news"
      />

      <RelatedTgeNewsPanel
        entityType="project"
        entityId={project.project_id}
        id="project-tge-news"
        sources={project.sources}
      />

      {sourceMatchCandidates.length > 0 ? (
        <div id="project-article-matches" className="scroll-mt-6">
          <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />
        </div>
      ) : null}

      <div id="project-ai-suggestions" className="scroll-mt-6">
        <PostgresFieldSuggestionsPanel
          canReviewStatus={canReviewRecord}
          candidates={fieldSuggestionCandidates}
        />
      </div>

      <DetailSection id="project-source-evidence" title="Source Evidence">
        <PostgresSourceEvidencePanel
          canManageSources={canEditRecord}
          confidenceStatuses={sourceReferenceData.confidenceStatuses}
          entityType="project"
          entityId={project.project_id}
          sourceOptions={sourceOptions}
          sources={project.sources}
        />
      </DetailSection>

      <div id="project-company-links" className="scroll-mt-6">
        <ProjectCompanyLinksPanel
          links={companyLinks}
          projectId={project.project_id}
          referenceData={relationshipReferenceData}
          sources={project.sources}
        />
      </div>

      <div id="project-promotion" className="scroll-mt-6">
        <PostgresProjectPromotionPanel
          canPromote={canPromoteRecord}
          projectId={project.project_id}
          promotedAssets={promotedAssets}
        />
      </div>

      <div id="project-research-issues" className="scroll-mt-6">
        <PostgresResearchIssuesPanel
          canManageIssues={canEditRecord}
          entityId={project.project_id}
          entityType="project"
          issueReferenceData={issueReferenceData}
          issues={researchIssues}
        />
      </div>

      <PendingReviewChangesPanel
        currentReviewStatus={project.review_status_code}
        events={auditEvents}
        id="project-review-changes"
      />

      <AuditTrailPanel events={auditEvents} id="project-audit-trail" />

      <ExportReadinessPanel
        id="project-export-readiness"
        issues={readinessIssues}
        sourceCount={project.sources.length}
        credibleSourceCount={credibleSourceCount}
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {project.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
