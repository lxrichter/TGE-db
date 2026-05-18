import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canEdit, canPromoteProject, canReview } from "@/lib/auth/roles";
import {
  DetailFieldGrid,
  DetailSection,
  DetailShell,
  ExportReadinessPanel,
  NotFoundNotice,
  StatusBadge,
  type ExportReadinessIssue,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { ProjectCompanyLinksPanel } from "@/components/postgres-preview/PostgresRelationshipManager";
import PostgresReviewStatusActions from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresProjectPromotionPanel from "@/components/postgres-preview/PostgresProjectPromotionPanel";
import PostgresResearchIssuesPanel from "@/components/postgres-preview/PostgresResearchIssuesPanel";
import PostgresSourceEvidencePanel from "@/components/postgres-preview/PostgresSourceEvidencePanel";
import type { PostgresPreviewProjectDetail } from "@/lib/postgres-preview";
import {
  getPostgresCompanyRelationshipReferenceData,
  getPostgresEntityFormReferenceData,
  getPostgresPreviewProjectById,
  getPostgresResearchOpsIssueReferenceData,
  listPostgresPromotedOperatingAssets,
  listPostgresProjectCompanyLinks,
  listPostgresResearchOpsIssuesForEntity,
} from "@/lib/postgres-preview";
import { getSourceFormReferenceData, listSources } from "@/lib/services/sources";
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
    getServerSession(authOptions),
  ]);

  if (!project) {
    return <NotFoundNotice label="Project" backHref="/postgres-preview" />;
  }

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
        canReviewStatus={canReview(
          (session?.user as { role?: string | null } | undefined)?.role
        )}
        currentStatus={project.review_status_code}
        entityId={project.project_id}
        entityType="project"
        reviewStatuses={entityReferenceData.reviewStatuses}
      />

      <DetailSection title="Source Evidence">
        <PostgresSourceEvidencePanel
          canManageSources={canEdit(
            (session?.user as { role?: string | null } | undefined)?.role
          )}
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
        canPromote={canPromoteProject(
          (session?.user as { role?: string | null } | undefined)?.role
        )}
        projectId={project.project_id}
        promotedAssets={promotedAssets}
      />

      <PostgresResearchIssuesPanel
        canManageIssues={canEdit(
          (session?.user as { role?: string | null } | undefined)?.role
        )}
        entityId={project.project_id}
        entityType="project"
        issueReferenceData={issueReferenceData}
        issues={researchIssues}
      />

      <ExportReadinessPanel
        issues={getProjectReadinessIssues(project)}
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
