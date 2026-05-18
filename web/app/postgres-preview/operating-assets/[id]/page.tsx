import {
  DetailFieldGrid,
  DetailSection,
  DetailShell,
  NotFoundNotice,
  SourceEvidenceTable,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { getPostgresPreviewOperatingAssetById } from "@/lib/postgres-preview";
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

export default async function PostgresOperatingAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await getPostgresPreviewOperatingAssetById(id);

  if (!asset) {
    return <NotFoundNotice label="Operating asset" backHref="/postgres-preview" />;
  }

  return (
    <DetailShell
      eyebrow="PostgreSQL Plant / Facility"
      title={asset.asset_name}
      subtitle="Read-only PostgreSQL staging operating asset profile with source/evidence coverage."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
      badges={
        <>
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

      <DetailSection title="Source Evidence">
        <SourceEvidenceTable
          sources={asset.sources}
          entityType="operating_asset"
          entityId={asset.operating_asset_id}
        />
      </DetailSection>

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {asset.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
