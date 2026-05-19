import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canReview } from "@/lib/auth/roles";
import {
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
import {
  getPostgresCompanyRelationshipReferenceData,
  getPostgresEntityFormReferenceData,
  getPostgresPreviewCompanyById,
  getPostgresResearchOpsIssueReferenceData,
  listPostgresFieldSuggestionCandidatesForEntity,
  listPostgresCompanyOperatingAssetLinks,
  listPostgresCompanyProjectLinks,
  listPostgresCompanyRelationships,
  listPostgresResearchOpsIssuesForEntity,
  type PostgresPreviewCompanyDetail,
} from "@/lib/postgres-preview";
import { getSourceFormReferenceData, listSources } from "@/lib/services/sources";
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
    getServerSession(authOptions),
  ]);

  if (!company) {
    return <NotFoundNotice label="Company" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;

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

      <ExportReadinessPanel
        issues={getCompanyReadinessIssues(company)}
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
