import Link from "next/link";
import {
  DetailFieldGrid,
  DetailSection,
  DetailShell,
  NotFoundNotice,
  SourceEvidenceTable,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { getPostgresPreviewCompanyById } from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

function dateOnly(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default async function PostgresCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getPostgresPreviewCompanyById(id);

  if (!company) {
    return <NotFoundNotice label="Company" backHref="/postgres-preview" />;
  }

  return (
    <DetailShell
      eyebrow="PostgreSQL Company"
      title={company.company_name}
      subtitle="Read-only PostgreSQL staging company profile with source/evidence coverage."
      backHref="/postgres-preview"
      backLabel="Back to PostgreSQL Preview"
      badges={
        <>
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

      <DetailSection title="Source Evidence">
        <SourceEvidenceTable
          sources={company.sources}
          entityType="company"
          entityId={company.company_id}
        />
      </DetailSection>

      <DetailSection title="Notes">
        <p className="text-sm leading-7 text-gray-700">
          {company.notes || "No notes added."}
        </p>
      </DetailSection>
    </DetailShell>
  );
}
