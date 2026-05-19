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
  listPostgresFieldSuggestionCandidatesForEntity,
  listPostgresOperatingAssetCompanyLinks,
  listPostgresResearchOpsIssuesForEntity,
  type PostgresPreviewOperatingAssetDetail,
} from "@/lib/postgres-preview";
import {
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
      getServerSession(authOptions),
    ]);

  if (!asset) {
    return <NotFoundNotice label="Operating asset" backHref="/postgres-preview" />;
  }
  const role = (session?.user as { role?: string | null } | undefined)?.role;

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

      <ExportReadinessPanel
        issues={getAssetReadinessIssues(asset)}
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
