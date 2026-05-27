import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canReview } from "@/lib/auth/roles";
import {
  AuditTrailPanel,
  DetailAnchorNav,
  DetailFieldGrid,
  DetailPriorityMarker,
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
import { OperatingAssetCompanyLinksPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
import PostgresReviewStatusActions from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresResearchIssuesPanel from "@/components/postgres-preview/PostgresResearchIssuesPanel";
import PostgresSourceEvidencePanel from "@/components/postgres-preview/PostgresSourceEvidencePanel";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
import PostgresRecordActionHub, {
  PostgresNextRequiredActionStrip,
  type PostgresRecordAction,
} from "@/components/postgres-preview/PostgresRecordActionHub";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
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

function metric(value: number | null, suffix: string) {
  return value === null || value === undefined ? "-" : `${formatMw(value)} ${suffix}`;
}

function dateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
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
      detail: "Exports should use approved or export-ready plant records.",
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
      detail: "Country is a critical plant field for exports and analytics.",
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
      detail: "This plant cannot appear on coordinate-confirmed map layers.",
    });
  }

  return issues;
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
      title: "Plant identity",
      state: identityComplete ? "complete" : "attention",
      note: identityComplete
        ? "Core plant identity, country, status, and use type are present."
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
            : "No AI field suggestion workflow is active for this plant.",
    },
  ] satisfies GovernanceLifecycleStep[];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <GovernanceSignalCard
            label="Operating Status"
            value={formatGovernanceCode(asset.lifecycle_phase_code)}
            note={`${formatGovernanceCode(asset.primary_use_type_code)} · ${
              asset.country || "No country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <GovernanceBadge label={asset.project_group || "No plant/field group"} />
          </GovernanceSignalCard>
          <GovernanceSignalCard
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
            <GovernanceBadge label={asset.capacity_estimate_status_code || "unknown"} />
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
            <GovernanceBadge
              label={formatGovernanceCode(asset.review_status_code)}
              tone={reviewStatusTone(asset.review_status_code)}
            />
            <GovernanceBadge
              label={`${formatCount(auditEvents.length)} audit event${
                auditEvents.length === 1 ? "" : "s"
              }`}
            />
          </GovernanceSignalCard>
        </section>

        <GovernanceEvidenceSnapshot
          description="Confirmed source links supporting this plant. Source credibility and evidence confidence stay separate from plant field updates."
          emptyMessage="This plant cannot be treated as export-ready until at least one source is linked and reviewed."
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <GovernanceLifecyclePanel
        description="Operational readiness of this plant across identity, operating status, evidence, validation, and AI-assisted review."
        steps={lifecycleSteps}
        title="Plant Readiness"
      />
    </section>
  );
}

function AssetActionHub({
  asset,
  readinessIssues,
  researchIssues,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  companyLinkCount,
  canEditRecord,
}: {
  asset: PostgresPreviewOperatingAssetDetail;
  readinessIssues: ExportReadinessIssue[];
  researchIssues: PostgresResearchOpsIssue[];
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  companyLinkCount: number;
  canEditRecord: boolean;
}) {
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");
  const openIssues = openResearchIssues(researchIssues);
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const hasCod = Boolean(asset.cod_year || asset.cod_raw);
  const addSourceHref = `/sources/new?entityType=operating_asset&entityId=${asset.operating_asset_id}`;
  const actions: PostgresRecordAction[] = [];

  if (canEditRecord) {
    actions.push({
      label: "Edit Plant",
      detail:
        "Update identity, location, operating status, use type, COD, capacity, and notes.",
      href: `/postgres-preview/operating-assets/${asset.operating_asset_id}/edit`,
      tone: blockers.length > 0 || warnings.length > 0 ? "warning" : "neutral",
      primary: blockers.length > 0,
      group: "record",
    });
  }

  actions.push({
    label: "Review COD / Capacity",
    detail:
      hasAssetCapacity(asset) && hasCod
        ? "Capacity/output and COD fields are present for this plant."
        : "Confirm COD, installed/running capacity, thermal output, or explain gaps.",
    href: "#asset-operating-data",
    tone: hasAssetCapacity(asset) && hasCod ? "ready" : "warning",
    group: "record",
  });

  actions.push({
    label:
      asset.sources.length === 0
        ? "Add Plant Evidence"
        : "Review Plant Evidence",
    detail:
      asset.sources.length === 0
        ? "Open source creation with this plant preselected as the linked target."
        : `${formatCount(asset.sources.length)} linked source${
            asset.sources.length === 1 ? "" : "s"
          }; review credibility and operating claims.`,
    href: asset.sources.length === 0 ? addSourceHref : "#asset-source-evidence",
    tone: asset.sources.length === 0 ? "blocker" : "ready",
    primary: asset.sources.length === 0,
    group: "evidence",
  });

  if (openSourceMatchCount > 0) {
    actions.push({
      label: "Review Article Matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can support related news and evidence links.`,
      href: "#asset-article-matches",
      tone: "warning",
      primary: asset.sources.length === 0,
      group: "evidence",
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
      href: "#asset-ai-suggestions",
      tone: "warning",
      group: "governance",
    });
  }

  actions.push({
    label: "Company Links",
    detail:
      companyLinkCount > 0
        ? `${formatCount(companyLinkCount)} structured company role${
            companyLinkCount === 1 ? "" : "s"
          } linked to this plant.`
        : "Review owner, operator, supplier, EPC, offtaker, and other plant roles.",
    href: "#asset-company-links",
    tone: companyLinkCount > 0 ? "ready" : "neutral",
    group: "relationships",
  });

  if (asset.promoted_from_project_id) {
    actions.push({
      label: "Originating Project",
      detail: "Open the source project that promoted into this plant.",
      href: `/postgres-preview/projects/${asset.promoted_from_project_id}`,
      tone: "ready",
      group: "relationships",
    });
  }

  if (openIssues.length > 0) {
    actions.push({
      label: "Research Issues",
      detail: `${formatCount(openIssues.length)} open persistent issue${
        openIssues.length === 1 ? "" : "s"
      } assigned or tracked for this record.`,
      href: "#asset-research-issues",
      tone: "warning",
      group: "governance",
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
    href: "#asset-export-readiness",
    tone: blockers.length > 0 ? "blocker" : warnings.length > 0 ? "warning" : "ready",
    group: "governance",
  });

  return (
    <PostgresRecordActionHub
      actions={actions}
      blockerCount={blockers.length}
      description="Use this as the operational entry point for this plant: confirm operating data, strengthen evidence, review AI suggestions, manage company roles, and check export readiness."
      title="Operational Actions"
      warningCount={warnings.length}
    />
  );
}

function getAssetNextRequiredAction({
  asset,
  readinessIssues,
  companyLinkCount,
  openIssueCount,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  canEditRecord,
}: {
  asset: PostgresPreviewOperatingAssetDetail;
  readinessIssues: ExportReadinessIssue[];
  companyLinkCount: number;
  openIssueCount: number;
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  canEditRecord: boolean;
}): PostgresRecordAction {
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const identityComplete = Boolean(
    asset.asset_name &&
      asset.country &&
      asset.lifecycle_phase_code &&
      asset.lifecycle_phase_code !== "unknown" &&
      asset.primary_use_type_code &&
      asset.primary_use_type_code !== "unknown"
  );
  const hasCod = Boolean(asset.cod_year || asset.cod_raw);
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");

  if (asset.sources.length === 0) {
    return {
      label: "Add source evidence",
      detail:
        "This plant has no linked source yet. Open source creation with this plant preselected.",
      href: `/sources/new?entityType=operating_asset&entityId=${asset.operating_asset_id}`,
      tone: "blocker",
    };
  }

  if (!identityComplete) {
    return {
      label: "Complete plant identity",
      detail:
        "Confirm country, operating status, and geothermal use category before deeper review.",
      href: canEditRecord
        ? `/postgres-preview/operating-assets/${asset.operating_asset_id}/edit`
        : "#asset-identity-location",
      tone: "warning",
    };
  }

  if (!hasAssetCapacity(asset) || !hasCod) {
    return {
      label: "Confirm COD and capacity",
      detail:
        "Check commissioning/COD wording and installed, running, thermal, or output values.",
      href: canEditRecord
        ? `/postgres-preview/operating-assets/${asset.operating_asset_id}/edit`
        : "#asset-operating-data",
      tone: "warning",
    };
  }

  if (companyLinkCount === 0) {
    return {
      label: "Add company role",
      detail:
        "Add at least one structured owner, operator, supplier, EPC, offtaker, or related role.",
      href: "#asset-company-links",
      tone: "warning",
    };
  }

  if (openSourceMatchCount > 0) {
    return {
      label: "Review article matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can strengthen related news and evidence coverage.`,
      href: "#asset-article-matches",
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
      href: "#asset-ai-suggestions",
      tone: "warning",
    };
  }

  if (openIssueCount > 0) {
    return {
      label: "Resolve research issue",
      detail: `${formatCount(openIssueCount)} persistent Research Ops issue${
        openIssueCount === 1 ? "" : "s"
      } remain open for this plant.`,
      href: "#asset-research-issues",
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
      href: "#asset-export-readiness",
      tone: blockers.length > 0 ? "blocker" : "warning",
    };
  }

  return {
    label: "Ready for editor review",
    detail:
      "Core identity, operating data, source evidence, company roles, and export-readiness checks are clear for this plant.",
    href: "#asset-export-readiness",
    tone: "ready",
  };
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
    return <NotFoundNotice label="Plant" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const readinessIssues = getAssetReadinessIssues(asset);
  const canEditRecord = canEdit(role);
  const canReviewRecord = canReview(role);
  const credibleSourceCount = asset.sources.filter(
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
    asset.asset_name &&
      asset.country &&
      asset.lifecycle_phase_code &&
      asset.lifecycle_phase_code !== "unknown" &&
      asset.primary_use_type_code &&
      asset.primary_use_type_code !== "unknown"
  );
  const nextRequiredAction = getAssetNextRequiredAction({
    asset,
    canEditRecord,
    companyLinkCount: companyLinks.length,
    fieldSuggestionCandidates,
    openIssueCount,
    openSourceMatchCount,
    readinessIssues,
  });

  return (
    <DetailShell
      eyebrow="Plant Workspace"
      title={asset.asset_name}
      subtitle="Plant profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to Command Center"
      statusLegendDescription="Plant detail badges separate operating or development phase, review state, readiness severity, and source confidence."
      statusLegendGroups={["review", "lifecycle", "severity", "source"]}
      statusLegendTitle="Plant Status Meaning"
      badges={
        <>
          <Link
            href={`/postgres-preview/operating-assets/${asset.operating_asset_id}/edit`}
            className="inline-flex min-h-[28px] items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Edit
          </Link>
          <StatusBadge value={asset.primary_use_type_code} />
          <StatusBadge domain="lifecycle" value={asset.lifecycle_phase_code} />
          <StatusBadge domain="review" value={asset.review_status_code} />
        </>
      }
      stats={[
        {
          label: "Installed Power",
          value: metric(asset.electric_capacity_mwe, "MWe"),
          note: "Installed capacity",
        },
        {
          label: "Active Operating Power",
          value: metric(asset.electric_capacity_running_mwe, "MWe"),
          note: "Current online/available capacity",
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
      <PostgresNextRequiredActionStrip action={nextRequiredAction} />

      <PostgresSectionJumpNav
        items={[
          {
            href: "#asset-focus",
            label: "Focus",
            note: "Readiness",
          },
          {
            href: "#asset-record-data",
            label: "Plant Data",
            note: "Fields",
          },
          {
            href: "#asset-workflow",
            label: "Workflow",
            note: "Evidence",
          },
          {
            href: "#asset-governance",
            label: "Governance",
            note: "Export",
          },
        ]}
      />

      <section id="asset-focus" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Operational Focus"
          description="Operating state, readiness, next action."
          tone="core"
        />

        <DetailWorkflowMap
          description="Use this sequence to scan the plant record: confirm identity and operating data, strengthen evidence, check company roles, handle AI/review work, then decide whether the record is export-ready."
          steps={[
            {
              label: "Identity",
              href: "#asset-identity-location",
              status: identityComplete ? "complete" : "attention",
              note: identityComplete
                ? "Core plant identity, country, status, and use type are present."
                : "Confirm plant name, country, operating status, and use type.",
              meta: asset.country || "No country",
            },
            {
              label: "Evidence",
              href: "#asset-source-evidence",
              status:
                credibleSourceCount > 0
                  ? "complete"
                  : asset.sources.length > 0 || openSourceMatchCount > 0
                    ? "attention"
                    : "blocked",
              note:
                credibleSourceCount > 0
                  ? "At least one credible source is linked."
                  : "Add or review source evidence before export-ready use.",
              meta: `${formatCount(credibleSourceCount)}/${formatCount(
                asset.sources.length
              )} credible sources`,
            },
            {
              label: "Companies",
              href: "#asset-company-links",
              status: companyLinks.length > 0 ? "complete" : "attention",
              note:
                companyLinks.length > 0
                  ? "Structured owner, operator, supplier, or contractor roles are linked."
                  : "Add owner, operator, supplier, EPC, or other plant roles.",
              meta: `${formatCount(companyLinks.length)} relationship${
                companyLinks.length === 1 ? "" : "s"
              }`,
            },
            {
              label: "AI / Review",
              href: "#asset-ai-suggestions",
              status:
                fieldSuggestionSummary.open + fieldSuggestionSummary.applyReady >
                  0 || openIssueCount > 0
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
              href: "#asset-export-readiness",
              status:
                readinessBlockers.length > 0
                  ? "blocked"
                  : readinessWarnings.length > 0
                    ? "attention"
                    : "complete",
              note:
                readinessBlockers.length > 0
                  ? "Resolve blockers before export-ready use."
                  : "Review warnings before marking this plant export-ready.",
              meta: `${formatCount(readinessBlockers.length)} blocker${
                readinessBlockers.length === 1 ? "" : "s"
              }`,
            },
          ]}
        />

        <AssetGovernanceOverview
          asset={asset}
          auditEvents={auditEvents}
          fieldSuggestionCandidates={fieldSuggestionCandidates}
          openSourceMatchCount={openSourceMatchCount}
          readinessIssues={readinessIssues}
          researchIssues={researchIssues}
          sources={asset.sources}
        />

        <div id="asset-workflow-actions" className="scroll-mt-6">
          <AssetActionHub
            asset={asset}
            canEditRecord={canEditRecord}
            companyLinkCount={companyLinks.length}
            fieldSuggestionCandidates={fieldSuggestionCandidates}
            openSourceMatchCount={openSourceMatchCount}
            readinessIssues={readinessIssues}
            researchIssues={researchIssues}
          />
        </div>
      </section>

      <section id="asset-record-data" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core Profile"
          title="Plant Data"
          description="Identity, location, status, capacity, resource, technology, COD."
          tone="core"
        />

        <DetailAnchorNav
          items={[
            {
              label: "Identity",
              href: "#asset-identity-location",
              note: "Core identity, location, and research status fields",
            },
            {
              label: "Operation",
              href: "#asset-operating-data",
              note: "Operating status, capacity, technology, and COD fields",
            },
            {
              label: "TGE News",
              href: "#asset-tge-news",
              note: "Confirmed ThinkGeoEnergy article evidence",
            },
            {
              label: "AI Suggestions",
              href: "#asset-ai-suggestions",
              note: "Human-reviewed field suggestions from source extraction",
            },
            {
              label: "Evidence",
              href: "#asset-source-evidence",
              note: "Source/evidence links and linked field claims",
            },
            {
              label: "Companies",
              href: "#asset-company-links",
              note: "Owner, operator, supplier, EPC, and other plant roles",
            },
            {
              label: "Issues",
              href: "#asset-research-issues",
              note: "Persistent Research Ops issues",
            },
            {
              label: "Changes",
              href: "#asset-review-changes",
              note: "Changed fields that support review and reapproval",
            },
            {
              label: "Audit",
              href: "#asset-audit-trail",
              note: "Governed change history",
            },
            {
              label: "Export",
              href: "#asset-export-readiness",
              note: "Preview export-readiness checks",
            },
          ]}
        />

      <DetailSection id="asset-identity-location" title="Identity And Location">
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

      <DetailSection id="asset-operating-data" title="Resource, Capacity, And Operation">
        <DetailFieldGrid
          fields={[
            { label: "Resource Type", value: asset.resource_type },
            { label: "Resource Temp", value: metric(asset.resource_temp_c, "C") },
            {
              label: "Capacity Confidence",
              value: asset.capacity_estimate_status_code,
            },
            { label: "Output Confidence", value: asset.output_estimate_status_code },
            { label: "Commissioning / COD Year", value: asset.cod_year },
            { label: "Commissioning / COD Month", value: asset.cod_month },
            { label: "COD Source Text / Original Wording", value: asset.cod_raw },
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
      </section>

      <section id="asset-workflow" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Workflow"
          title="Workflow Support"
          description="Evidence, news, relationships, AI, issues."
          tone="workflow"
        />

      <PostgresReviewStatusActions
        canReviewStatus={canReviewRecord}
        currentStatus={asset.review_status_code}
        entityId={asset.operating_asset_id}
        entityType="operating_asset"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <EvidenceWorkflowContext
        aiSuggestionsHref="#asset-ai-suggestions"
        sourceEvidenceHref="#asset-source-evidence"
        tgeNewsHref="#asset-tge-news"
      />

      <RelatedTgeNewsPanel
        entityType="operating_asset"
        entityId={asset.operating_asset_id}
        id="asset-tge-news"
        sources={asset.sources}
      />

      {sourceMatchCandidates.length > 0 ? (
        <div id="asset-article-matches" className="scroll-mt-6">
          <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />
        </div>
      ) : null}

      <PostgresFieldSuggestionsPanel
        id="asset-ai-suggestions"
        canReviewStatus={canReviewRecord}
        candidates={fieldSuggestionCandidates}
        collapseWhenIdle
      />

      <DetailSection id="asset-source-evidence" title="Source Evidence">
        <PostgresSourceEvidencePanel
          canManageSources={canEditRecord}
          confidenceStatuses={sourceReferenceData.confidenceStatuses}
          entityType="operating_asset"
          entityId={asset.operating_asset_id}
          sourceOptions={sourceOptions}
          sources={asset.sources}
        />
      </DetailSection>

      <div id="asset-company-links" className="scroll-mt-6">
        <OperatingAssetCompanyLinksPanel
          links={companyLinks}
          operatingAssetId={asset.operating_asset_id}
          referenceData={relationshipReferenceData}
          sources={asset.sources}
        />
      </div>

      <div id="asset-research-issues" className="scroll-mt-6">
        <PostgresResearchIssuesPanel
          canManageIssues={canEditRecord}
          entityId={asset.operating_asset_id}
          entityType="operating_asset"
          issueReferenceData={issueReferenceData}
          issues={researchIssues}
        />
      </div>
      </section>

      <section id="asset-governance" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Governance"
          title="Review Controls"
          description="Changed fields, audit, export readiness, notes."
          tone="governance"
        />

      <PendingReviewChangesPanel
        currentReviewStatus={asset.review_status_code}
        events={auditEvents}
        id="asset-review-changes"
      />

      <AuditTrailPanel events={auditEvents} id="asset-audit-trail" />

      <ExportReadinessPanel
        id="asset-export-readiness"
        issues={readinessIssues}
        sourceCount={asset.sources.length}
        credibleSourceCount={credibleSourceCount}
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {asset.notes || "No notes added."}
        </p>
      </DetailSection>
      </section>
    </DetailShell>
  );
}
