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
import { CompanyRelationshipPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
import PostgresReviewStatusActions from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresResearchIssuesPanel from "@/components/postgres-preview/PostgresResearchIssuesPanel";
import PostgresSourceEvidencePanel from "@/components/postgres-preview/PostgresSourceEvidencePanel";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
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

type Tone = "green" | "amber" | "red" | "neutral";

type LifecycleState = "complete" | "attention" | "blocked" | "neutral";

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
      label: "Missing primary company type",
      detail: "Company category is required for export-ready filtering.",
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

function CompanySignalCard({
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

function CompanyLifecyclePanel({
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
        <h2 className="text-lg font-bold text-[#1f2937]">Company Workflow State</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Operational position of this company record across classification,
          activity links, evidence, validation, and AI-assisted review.
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

function CompanyEvidenceSnapshot({
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
            Confirmed source links supporting this company. Source credibility
            and evidence confidence stay separate from company field updates.
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
              This company cannot be treated as export-ready until at least one
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
      type: "Plant / Facility",
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
          plants/facilities, and company relationships.
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
              Plants / Facilities
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
                No project or plant/facility links yet.
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
          ? "The company is linked to project or plant/facility activity."
          : "No structured project or plant/facility role links yet.",
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
  ] satisfies Array<{ title: string; state: LifecycleState; note: string }>;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CompanySignalCard
            label="Classification"
            value={formatCode(company.company_type_primary_code)}
            note={`${formatCode(company.entity_type_code)} · ${
              company.headquarters_country || "No HQ country"
            }`}
            tone={identityComplete ? "green" : "amber"}
          >
            <TinyBadge label={company.company_status || "No company status"} />
          </CompanySignalCard>
          <CompanySignalCard
            label="Activity"
            value={formatCount(activityLinkCount)}
            note={`${formatCount(projectLinks.length)} project role${
              projectLinks.length === 1 ? "" : "s"
            } · ${formatCount(operatingAssetLinks.length)} asset role${
              operatingAssetLinks.length === 1 ? "" : "s"
            }`}
            tone={activityLinkCount > 0 ? "green" : "amber"}
          >
            <TinyBadge
              label={`${formatCount(relationships.length)} relationship${
                relationships.length === 1 ? "" : "s"
              }`}
            />
          </CompanySignalCard>
          <CompanySignalCard
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
          </CompanySignalCard>
          <CompanySignalCard
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
              label={formatCode(company.review_status_code)}
              tone={reviewTone(company.review_status_code)}
            />
            <TinyBadge
              label={`${formatCount(auditEvents.length)} audit event${
                auditEvents.length === 1 ? "" : "s"
              }`}
            />
          </CompanySignalCard>
        </section>

        <CompanyActivitySnapshot
          operatingAssetLinks={operatingAssetLinks}
          projectLinks={projectLinks}
          relationships={relationships}
        />

        <CompanyEvidenceSnapshot
          openSourceMatchCount={openSourceMatchCount}
          sources={sources}
        />
      </div>

      <CompanyLifecyclePanel steps={lifecycleSteps} />
    </section>
  );
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

  return (
    <DetailShell
      eyebrow="PostgreSQL Company"
      title={company.company_name}
      subtitle="PostgreSQL staging company profile with source/evidence coverage and preview export-readiness checks."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
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
          <StatusBadge value={company.review_status_code} />
        </>
      }
      stats={[
        {
          label: "HQ Country",
          value: company.headquarters_country || "-",
          note: "Company location",
        },
        {
          label: "Company Type",
          value: company.company_type_primary_code || "-",
          note: "Primary classification",
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

      <DetailSection title="Identity And Classification">
        <DetailFieldGrid
          fields={[
            { label: "Legacy ID", value: company.legacy_company_id },
            { label: "Short Name", value: company.company_name_short },
            { label: "Legal Name", value: company.company_legal_name },
            { label: "Status", value: company.company_status },
            { label: "Ownership Type", value: company.ownership_type },
            { label: "Entity Type", value: company.entity_type_code },
            { label: "HQ City", value: company.headquarters_city },
            { label: "HQ Country", value: company.headquarters_country },
            { label: "Region", value: company.region },
          ]}
        />
      </DetailSection>

      <DetailSection title="Market Focus">
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

      <PostgresReviewStatusActions
        canReviewStatus={canReview(role)}
        currentStatus={company.review_status_code}
        entityId={company.company_id}
        entityType="company"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <CompanyRelationshipPanel
        companyId={company.company_id}
        operatingAssetLinks={operatingAssetLinks}
        projectLinks={projectLinks}
        referenceData={relationshipReferenceData}
        relationships={relationships}
      />

      <RelatedTgeNewsPanel
        entityType="company"
        entityId={company.company_id}
        sources={company.sources}
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
          entityType="company"
          entityId={company.company_id}
          sourceOptions={sourceOptions}
          sources={company.sources}
        />
      </DetailSection>

      <PostgresResearchIssuesPanel
        canManageIssues={canEdit(role)}
        entityId={company.company_id}
        entityType="company"
        issueReferenceData={issueReferenceData}
        issues={researchIssues}
      />

      <AuditTrailPanel events={auditEvents} />

      <ExportReadinessPanel
        issues={readinessIssues}
        sourceCount={company.sources.length}
        credibleSourceCount={
          company.sources.filter(
            (source) => source.credibility_status_code === "credible"
          ).length
        }
      />

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {company.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
