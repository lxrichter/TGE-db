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
import { CompanyRelationshipPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
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
  getPostgresPreviewCompanyById,
  getPostgresResearchOpsIssueReferenceData,
  listPostgresAuditEventsForEntity,
  listPostgresFieldSuggestionCandidatesForEntity,
  listPostgresCompanyOperatingAssetLinks,
  listPostgresCompanyProjectLinks,
  listPostgresCompanyRelationships,
  listPostgresResearchOpsIssuesForEntity,
  type PostgresAuditEvent,
  type PostgresCompanyOperatingAssetLink,
  type PostgresCompanyProjectLink,
  type PostgresCompanyRelationship,
  type PostgresEntitySourceLink,
  type PostgresFieldSuggestionCandidate,
  type PostgresPreviewCompanyDetail,
  type PostgresResearchOpsIssue,
} from "@/lib/postgres-preview";
import {
  countSourceMatchCandidates,
  getSourceFormReferenceData,
  listSourceMatchCandidates,
  listSources,
} from "@/lib/services/sources";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

function dateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function getCompanyReadinessIssues(
  company: PostgresPreviewCompanyDetail
): ExportReadinessIssue[] {
  const issues: ExportReadinessIssue[] = [];
  const credibleSourceCount = company.sources.filter(
    (source) => source.credibility_status_code === "credible"
  ).length;
  const approvedStatuses = new Set(["approved", "export_ready"]);

  if (!approvedStatuses.has(company.review_status_code)) {
    issues.push({
      severity: "blocker",
      label: "Review status not approved",
      detail: "Exports should use approved or export-ready company records.",
    });
  }

  if (company.sources.length === 0) {
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

  if (!company.company_type_primary_code) {
    issues.push({
      severity: "blocker",
      label: "Missing primary business identity",
      detail: "Primary business identity is required for export-ready filtering.",
    });
  }

  if (!company.headquarters_country) {
    issues.push({
      severity: "warning",
      label: "Missing headquarters country",
      detail: "HQ country is strongly recommended for company intelligence.",
    });
  }

  if (!company.website_url) {
    issues.push({
      severity: "warning",
      label: "Missing website",
      detail: "A website or equivalent source reference improves confidence.",
    });
  }

  return issues;
}

function CompanyActivitySnapshot({
  projectLinks,
  operatingAssetLinks,
  relationships,
}: {
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
}) {
  const primaryProjectLinks = projectLinks.filter((link) => link.is_primary);
  const primaryAssetLinks = operatingAssetLinks.filter((link) => link.is_primary);
  const currentRelationships = relationships.filter((relationship) => relationship.is_current);
  const recentLinks = [
    ...projectLinks.map((link) => ({
      key: link.company_project_link_id,
      label: link.project_name,
      href: `/postgres-preview/projects/${link.project_id}`,
      type: "Project",
      role: link.role_label || link.role_code,
      country: link.country,
      updated_at: link.updated_at,
    })),
    ...operatingAssetLinks.map((link) => ({
      key: link.company_operating_asset_link_id,
      label: link.asset_name,
      href: `/postgres-preview/operating-assets/${link.operating_asset_id}`,
      type: "Plant",
      role: link.role_label || link.role_code,
      country: link.country,
      updated_at: link.updated_at,
    })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Activity Footprint</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Structured links showing where this company appears in projects,
          plants, and company relationships.
        </p>
      </div>
      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_280px]">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Projects
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1f2937]">
              {formatCount(projectLinks.length)}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formatCount(primaryProjectLinks.length)} primary role
              {primaryProjectLinks.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Plants
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1f2937]">
              {formatCount(operatingAssetLinks.length)}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formatCount(primaryAssetLinks.length)} primary role
              {primaryAssetLinks.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Relationships
            </div>
            <div className="mt-2 text-2xl font-bold text-[#1f2937]">
              {formatCount(relationships.length)}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formatCount(currentRelationships.length)} current relationship
              {currentRelationships.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
          <div className="text-sm font-bold text-[#1f2937]">Recent Links</div>
          <div className="mt-3 divide-y divide-gray-100">
            {recentLinks.map((link) => (
              <div key={link.key} className="py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {link.type}
                </div>
                <Link
                  href={link.href}
                  className="mt-1 block font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                >
                  {link.label}
                </Link>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  {link.role}
                  {link.country ? ` · ${link.country}` : ""}
                </div>
              </div>
            ))}
            {recentLinks.length === 0 ? (
              <div className="py-3 text-sm text-gray-500">
                No project or plant links yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyGovernanceOverview({
  company,
  readinessIssues,
  researchIssues,
  sources,
  projectLinks,
  operatingAssetLinks,
  relationships,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  auditEvents,
}: {
  company: PostgresPreviewCompanyDetail;
  readinessIssues: ExportReadinessIssue[];
  researchIssues: PostgresResearchOpsIssue[];
  sources: PostgresEntitySourceLink[];
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
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
  const activityLinkCount = projectLinks.length + operatingAssetLinks.length;
  const identityComplete = Boolean(
    company.company_name && company.company_type_primary_code
  );
  const lifecycleSteps = [
    {
      title: "Company identity",
      state: identityComplete ? "complete" : "attention",
      note: identityComplete
        ? "Company name and primary category are present."
        : "Company name/category requires attention before export-ready use.",
    },
    {
      title: "Activity links",
      state: activityLinkCount > 0 ? "complete" : "attention",
      note:
        activityLinkCount > 0
          ? "The company is linked to project or plant activity."
          : "No structured project or plant role links yet.",
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
            : "No AI field suggestion workflow is active for this company.",
    },
  ] satisfies GovernanceLifecycleStep[];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <GovernanceSignalCard
            label="Classification"
            value={formatGovernanceCode(company.company_type_primary_code)}
            note={`${formatGovernanceCode(company.entity_type_code)} · ${
              company.headquarters_country || "No HQ country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <GovernanceBadge label={company.company_status || "No company status"} />
          </GovernanceSignalCard>
          <GovernanceSignalCard
            label="Activity"
            value={formatCount(activityLinkCount)}
            note={`${formatCount(projectLinks.length)} project role${
              projectLinks.length === 1 ? "" : "s"
            } · ${formatCount(operatingAssetLinks.length)} plant role${
              operatingAssetLinks.length === 1 ? "" : "s"
            }`}
            tone={activityLinkCount > 0 ? "green" : "amber"}
          >
            <GovernanceBadge
              label={`${formatCount(relationships.length)} relationship${
                relationships.length === 1 ? "" : "s"
              }`}
            />
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
              label={formatGovernanceCode(company.review_status_code)}
              tone={reviewStatusTone(company.review_status_code)}
            />
            <GovernanceBadge
              label={`${formatCount(auditEvents.length)} audit event${
                auditEvents.length === 1 ? "" : "s"
              }`}
            />
          </GovernanceSignalCard>
        </section>

        <CompanyActivitySnapshot
          operatingAssetLinks={operatingAssetLinks}
          projectLinks={projectLinks}
          relationships={relationships}
        />

        <GovernanceEvidenceSnapshot
          description="Confirmed source links supporting this company. Source credibility and evidence confidence stay separate from company field updates."
          emptyMessage="This company cannot be treated as export-ready until at least one source is linked and reviewed."
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <GovernanceLifecyclePanel
        description="Operational readiness of this company record across classification, activity links, evidence, validation, and AI-assisted review."
        steps={lifecycleSteps}
        title="Company Readiness"
      />
    </section>
  );
}

function CompanyActionHub({
  company,
  readinessIssues,
  researchIssues,
  projectLinks,
  operatingAssetLinks,
  relationships,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  canEditRecord,
}: {
  company: PostgresPreviewCompanyDetail;
  readinessIssues: ExportReadinessIssue[];
  researchIssues: PostgresResearchOpsIssue[];
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  canEditRecord: boolean;
}) {
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");
  const openIssues = openResearchIssues(researchIssues);
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const activityLinkCount =
    projectLinks.length + operatingAssetLinks.length + relationships.length;
  const addSourceHref = `/sources/new?entityType=company&entityId=${company.company_id}`;
  const actions: PostgresRecordAction[] = [];

  if (canEditRecord) {
    actions.push({
      label: "Edit Company",
      detail:
        "Update identity, classification, HQ details, website, market focus, and notes.",
      href: `/postgres-preview/companies/${company.company_id}/edit`,
      tone: blockers.length > 0 || warnings.length > 0 ? "warning" : "neutral",
      primary: blockers.length > 0,
      group: "record",
    });
  }

  actions.push({
    label: "Review Identity",
    detail:
      company.company_type_primary_code && company.headquarters_country
        ? "Primary business identity and HQ country are present."
        : "Confirm primary business identity, status, HQ country, and website details.",
    href: "#company-classification",
    tone:
      company.company_type_primary_code && company.headquarters_country
        ? "ready"
        : "warning",
    group: "record",
  });

  actions.push({
    label: "Relationships / Portfolio",
    detail:
      activityLinkCount > 0
        ? `${formatCount(activityLinkCount)} structured project, plant, or company relationship${
            activityLinkCount === 1 ? "" : "s"
          } linked.`
        : "Add project roles, plant roles, ownership, group, or JV relationships.",
    href: "#company-relationships",
    tone: activityLinkCount > 0 ? "ready" : "warning",
    group: "relationships",
  });

  actions.push({
    label:
      company.sources.length === 0
        ? "Add Company Evidence"
        : "Review Company Evidence",
    detail:
      company.sources.length === 0
        ? "Open source creation with this company preselected as the linked target."
        : `${formatCount(company.sources.length)} linked source${
            company.sources.length === 1 ? "" : "s"
          }; review credibility and relationship claims.`,
    href: company.sources.length === 0 ? addSourceHref : "#company-source-evidence",
    tone: company.sources.length === 0 ? "blocker" : "ready",
    primary: company.sources.length === 0,
    group: "evidence",
  });

  if (openSourceMatchCount > 0) {
    actions.push({
      label: "Review Article Matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can support related news and evidence links.`,
      href: "#company-article-matches",
      tone: "warning",
      primary: company.sources.length === 0,
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
      href: "#company-ai-suggestions",
      tone: "warning",
      group: "governance",
    });
  }

  if (openIssues.length > 0) {
    actions.push({
      label: "Research Issues",
      detail: `${formatCount(openIssues.length)} open persistent issue${
        openIssues.length === 1 ? "" : "s"
      } assigned or tracked for this record.`,
      href: "#company-research-issues",
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
    href: "#company-export-readiness",
    tone: blockers.length > 0 ? "blocker" : warnings.length > 0 ? "warning" : "ready",
    group: "governance",
  });

  return (
    <PostgresRecordActionHub
      actions={actions}
      blockerCount={blockers.length}
      description="Use this as the operational entry point for this company record: confirm classification, manage portfolios and ownership links, strengthen evidence, review AI suggestions, and check export readiness."
      title="Company Actions"
      warningCount={warnings.length}
    />
  );
}

function getCompanyNextRequiredAction({
  company,
  readinessIssues,
  activityLinkCount,
  openIssueCount,
  openSourceMatchCount,
  fieldSuggestionCandidates,
  canEditRecord,
}: {
  company: PostgresPreviewCompanyDetail;
  readinessIssues: ExportReadinessIssue[];
  activityLinkCount: number;
  openIssueCount: number;
  openSourceMatchCount: number;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
  canEditRecord: boolean;
}): PostgresRecordAction {
  const fieldSuggestionSummary = fieldSuggestionCounts(fieldSuggestionCandidates);
  const identityComplete = Boolean(
    company.company_name && company.company_type_primary_code
  );
  const blockers = readinessIssues.filter((issue) => issue.severity === "blocker");
  const warnings = readinessIssues.filter((issue) => issue.severity === "warning");

  if (company.sources.length === 0) {
    return {
      label: "Add source evidence",
      detail:
        "This company has no linked source yet. Open source creation with this company preselected.",
      href: `/sources/new?entityType=company&entityId=${company.company_id}`,
      tone: "blocker",
    };
  }

  if (!identityComplete || !company.headquarters_country || !company.website_url) {
    return {
      label: "Complete company identity",
      detail:
        "Confirm primary business identity, HQ country, website, and status before deeper review.",
      href: canEditRecord
        ? `/postgres-preview/companies/${company.company_id}/edit`
        : "#company-classification",
      tone: "warning",
    };
  }

  if (activityLinkCount === 0) {
    return {
      label: "Add relationship or portfolio link",
      detail:
        "Add project roles, plant roles, ownership, group, JV, or other structured relationships.",
      href: "#company-relationships",
      tone: "warning",
    };
  }

  if (openSourceMatchCount > 0) {
    return {
      label: "Review article matches",
      detail: `${formatCount(openSourceMatchCount)} source/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } can strengthen related news and evidence coverage.`,
      href: "#company-article-matches",
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
      href: "#company-ai-suggestions",
      tone: "warning",
    };
  }

  if (openIssueCount > 0) {
    return {
      label: "Resolve research issue",
      detail: `${formatCount(openIssueCount)} persistent Research Ops issue${
        openIssueCount === 1 ? "" : "s"
      } remain open for this company.`,
      href: "#company-research-issues",
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
      href: "#company-export-readiness",
      tone: blockers.length > 0 ? "blocker" : "warning",
    };
  }

  return {
    label: "Ready for editor review",
    detail:
      "Core identity, source evidence, relationship links, and export-readiness checks are clear for this company.",
    href: "#company-export-readiness",
    tone: "ready",
  };
}

export default async function PostgresCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    company,
    projectLinks,
    operatingAssetLinks,
    relationships,
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
  ] = await Promise.all([
    getPostgresPreviewCompanyById(id),
    listPostgresCompanyProjectLinks(id),
    listPostgresCompanyOperatingAssetLinks(id),
    listPostgresCompanyRelationships(id),
    getPostgresCompanyRelationshipReferenceData(),
    getPostgresEntityFormReferenceData(),
    listPostgresResearchOpsIssuesForEntity("company", id),
    getPostgresResearchOpsIssueReferenceData(),
    listSources({ limit: 250 }),
    getSourceFormReferenceData(),
    listPostgresFieldSuggestionCandidatesForEntity("company", id),
    listSourceMatchCandidates({
      entityType: "company",
      entityId: id,
      limit: 12,
      openOnly: true,
    }),
    countSourceMatchCandidates({
      entityType: "company",
      entityId: id,
      openOnly: true,
    }),
    listPostgresAuditEventsForEntity("company", id),
    getServerSession(authOptions),
  ]);

  if (!company) {
    return <NotFoundNotice label="Company" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const readinessIssues = getCompanyReadinessIssues(company);
  const canEditRecord = canEdit(role);
  const canReviewRecord = canReview(role);
  const credibleSourceCount = company.sources.filter(
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
  const activityLinkCount =
    projectLinks.length + operatingAssetLinks.length + relationships.length;
  const identityComplete = Boolean(
    company.company_name && company.company_type_primary_code
  );
  const nextRequiredAction = getCompanyNextRequiredAction({
    activityLinkCount,
    canEditRecord,
    company,
    fieldSuggestionCandidates,
    openIssueCount,
    openSourceMatchCount,
    readinessIssues,
  });

  return (
    <DetailShell
      eyebrow="Company Workspace"
      title={company.company_name}
      subtitle="Company profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to Command Center"
      statusLegendDescription="Company detail badges separate business identity, review state, relationship/evidence issue severity, source credibility, and AI/match confidence."
      statusLegendGroups={["review", "severity", "source", "confidence"]}
      statusLegendTitle="Company Status Meaning"
      badges={
        <>
          <Link
            href={`/postgres-preview/companies/${company.company_id}/edit`}
            className="inline-flex min-h-[28px] items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Edit
          </Link>
          <StatusBadge value={company.entity_type_code} />
          <StatusBadge value={company.company_type_primary_code} />
          <StatusBadge domain="review" value={company.review_status_code} />
        </>
      }
      stats={[
        {
          label: "HQ Country",
          value: company.headquarters_country || "-",
          note: "Company location",
        },
        {
          label: "Business Identity",
          value: company.company_type_primary_code || "-",
          note: "Primary market position",
        },
        {
          label: "Sources",
          value: formatCount(company.source_count),
          note: "Evidence links",
        },
        {
          label: "Research",
          value: company.research_status || "-",
          note: "Workflow status",
        },
        {
          label: "Updated",
          value: dateOnly(company.updated_at),
          note: "PostgreSQL timestamp",
        },
      ]}
    >
      <PostgresNextRequiredActionStrip action={nextRequiredAction} />

      <PostgresSectionJumpNav
        items={[
          {
            href: "#company-focus",
            label: "Focus",
            note: "Readiness",
          },
          {
            href: "#company-record-data",
            label: "Company Data",
            note: "Fields",
          },
          {
            href: "#company-workflow",
            label: "Workflow",
            note: "Relationships",
          },
          {
            href: "#company-governance",
            label: "Governance",
            note: "Export",
          },
        ]}
      />

      <section id="company-focus" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Operational Focus"
          description="Classification, readiness, next action."
          tone="core"
        />

        <DetailWorkflowMap
          description="Use this sequence to scan the company record: confirm classification, strengthen evidence, check activity and ownership relationships, handle AI/review work, then decide whether the record is export-ready."
          steps={[
            {
              label: "Identity",
              href: "#company-classification",
              status: identityComplete ? "complete" : "attention",
              note: identityComplete
                ? "Company name and primary category are present."
                : "Confirm company name, legal identity, status, and primary category.",
              meta: company.headquarters_country || "No HQ country",
            },
            {
              label: "Evidence",
              href: "#company-source-evidence",
              status:
                credibleSourceCount > 0
                  ? "complete"
                  : company.sources.length > 0 || openSourceMatchCount > 0
                    ? "attention"
                    : "blocked",
              note:
                credibleSourceCount > 0
                  ? "At least one credible source is linked."
                  : "Add or review source evidence before export-ready use.",
              meta: `${formatCount(credibleSourceCount)}/${formatCount(
                company.sources.length
              )} credible sources`,
            },
            {
              label: "Relationships",
              href: "#company-relationships",
              status: activityLinkCount > 0 ? "complete" : "attention",
              note:
                activityLinkCount > 0
                  ? "Structured project, plant, or company relationships are linked."
                  : "Add project roles, plant roles, ownership, group, or JV links.",
              meta: `${formatCount(activityLinkCount)} relationship${
                activityLinkCount === 1 ? "" : "s"
              }`,
            },
            {
              label: "AI / Review",
              href: "#company-ai-suggestions",
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
              href: "#company-export-readiness",
              status:
                readinessBlockers.length > 0
                  ? "blocked"
                  : readinessWarnings.length > 0
                    ? "attention"
                    : "complete",
              note:
                readinessBlockers.length > 0
                  ? "Resolve blockers before export-ready use."
                  : "Review warnings before marking this company export-ready.",
              meta: `${formatCount(readinessBlockers.length)} blocker${
                readinessBlockers.length === 1 ? "" : "s"
              }`,
            },
          ]}
        />

        <CompanyGovernanceOverview
          auditEvents={auditEvents}
          company={company}
          fieldSuggestionCandidates={fieldSuggestionCandidates}
          openSourceMatchCount={openSourceMatchCount}
          operatingAssetLinks={operatingAssetLinks}
          projectLinks={projectLinks}
          readinessIssues={readinessIssues}
          relationships={relationships}
          researchIssues={researchIssues}
          sources={company.sources}
        />

        <CompanyActionHub
          canEditRecord={canEditRecord}
          company={company}
          fieldSuggestionCandidates={fieldSuggestionCandidates}
          openSourceMatchCount={openSourceMatchCount}
          operatingAssetLinks={operatingAssetLinks}
          projectLinks={projectLinks}
          readinessIssues={readinessIssues}
          relationships={relationships}
          researchIssues={researchIssues}
        />
      </section>

      <section id="company-record-data" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core Profile"
          title="Company Data"
          description="Identity, classification, market focus, website, activity context."
          tone="core"
        />

        <DetailAnchorNav
          items={[
            {
              label: "Classification",
              href: "#company-classification",
              note: "Identity, legal name, category, status, and HQ fields",
            },
            {
              label: "Market Focus",
              href: "#company-market-focus",
              note: "Geothermal focus, technology focus, and market scope",
            },
            {
              label: "Relationships",
              href: "#company-relationships",
              note: "Project, plant, ownership, group, and JV links",
            },
            {
              label: "TGE News",
              href: "#company-tge-news",
              note: "Confirmed ThinkGeoEnergy article evidence",
            },
            {
              label: "AI Suggestions",
              href: "#company-ai-suggestions",
              note: "Human-reviewed field suggestions from source extraction",
            },
            {
              label: "Evidence",
              href: "#company-source-evidence",
              note: "Source/evidence links and linked field claims",
            },
            {
              label: "Issues",
              href: "#company-research-issues",
              note: "Persistent Research Ops issues",
            },
            {
              label: "Changes",
              href: "#company-review-changes",
              note: "Changed fields that support review and reapproval",
            },
            {
              label: "Audit",
              href: "#company-audit-trail",
              note: "Governed change history",
            },
            {
              label: "Export",
              href: "#company-export-readiness",
              note: "Preview export-readiness checks",
            },
          ]}
        />

      <DetailSection id="company-classification" title="Identity And Classification">
        <DetailFieldGrid
          fields={[
            { label: "Legacy ID", value: company.legacy_company_id },
            { label: "Short Name", value: company.company_name_short },
            { label: "Legal Name", value: company.company_legal_name },
            { label: "Status", value: company.company_status },
            { label: "Ownership Type", value: company.ownership_type },
            { label: "Company Record Type", value: company.entity_type_code },
            { label: "HQ City", value: company.headquarters_city },
            { label: "HQ Country", value: company.headquarters_country },
            { label: "Region", value: company.region },
          ]}
        />
      </DetailSection>

      <DetailSection id="company-market-focus" title="Market Focus">
        <DetailFieldGrid
          fields={[
            { label: "Geothermal Focus", value: company.geothermal_focus },
            { label: "Technology Focus", value: company.technology_focus },
            { label: "Service Scope", value: company.service_scope_summary },
            {
              label: "Operating Markets",
              value: company.operating_markets_summary,
            },
            {
              label: "Website",
              value: company.website_url ? (
                <Link
                  href={company.website_url}
                  target="_blank"
                  className="break-all font-semibold text-[#4f7f1f] hover:underline"
                >
                  {company.website_url}
                </Link>
              ) : null,
            },
            {
              label: "LinkedIn",
              value: company.linkedin_url ? (
                <Link
                  href={company.linkedin_url}
                  target="_blank"
                  className="break-all font-semibold text-[#4f7f1f] hover:underline"
                >
                  {company.linkedin_url}
                </Link>
              ) : null,
            },
          ]}
        />
      </DetailSection>
      </section>

      <section id="company-workflow" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Workflow"
          title="Workflow Support"
          description="Relationships, evidence, news, AI, issues."
          tone="workflow"
        />

      <PostgresReviewStatusActions
        canReviewStatus={canReviewRecord}
        currentStatus={company.review_status_code}
        entityId={company.company_id}
        entityType="company"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <div id="company-relationships" className="scroll-mt-6">
        <CompanyRelationshipPanel
          companyId={company.company_id}
          operatingAssetLinks={operatingAssetLinks}
          projectLinks={projectLinks}
          referenceData={relationshipReferenceData}
          relationships={relationships}
          sources={company.sources}
        />
      </div>

      <EvidenceWorkflowContext
        aiSuggestionsHref="#company-ai-suggestions"
        sourceEvidenceHref="#company-source-evidence"
        tgeNewsHref="#company-tge-news"
      />

      <RelatedTgeNewsPanel
        entityType="company"
        entityId={company.company_id}
        id="company-tge-news"
        sources={company.sources}
      />

      {sourceMatchCandidates.length > 0 ? (
        <div id="company-article-matches" className="scroll-mt-6">
          <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />
        </div>
      ) : null}

      <PostgresFieldSuggestionsPanel
        id="company-ai-suggestions"
        canReviewStatus={canReviewRecord}
        candidates={fieldSuggestionCandidates}
        collapseWhenIdle
      />

      <DetailSection id="company-source-evidence" title="Source Evidence">
        <PostgresSourceEvidencePanel
          canManageSources={canEditRecord}
          confidenceStatuses={sourceReferenceData.confidenceStatuses}
          entityType="company"
          entityId={company.company_id}
          sourceOptions={sourceOptions}
          sources={company.sources}
        />
      </DetailSection>

      <div id="company-research-issues" className="scroll-mt-6">
        <PostgresResearchIssuesPanel
          canManageIssues={canEditRecord}
          entityId={company.company_id}
          entityType="company"
          issueReferenceData={issueReferenceData}
          issues={researchIssues}
        />
      </div>
      </section>

      <section id="company-governance" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Governance"
          title="Review Controls"
          description="Changed fields, audit, export readiness, notes."
          tone="governance"
        />

      <PendingReviewChangesPanel
        currentReviewStatus={company.review_status_code}
        events={auditEvents}
        id="company-review-changes"
      />

      <AuditTrailPanel events={auditEvents} id="company-audit-trail" />

      <ExportReadinessPanel
        id="company-export-readiness"
        issues={readinessIssues}
        sourceCount={company.sources.length}
        credibleSourceCount={credibleSourceCount}
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {company.notes || "No notes added."}
        </p>
      </DetailSection>
      </section>
    </DetailShell>
  );
}
