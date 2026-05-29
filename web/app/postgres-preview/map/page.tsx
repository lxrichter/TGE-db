import Link from "next/link";
import GroupedMap from "@/components/GroupedMap";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";
import { formatCount, formatMw } from "@/lib/format";
import {
  listPostgresPreviewMapGroups,
  type PostgresPreviewGeographyFilters,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type MapSummary = {
  plantGroupCount: number;
  projectGroupCount: number;
  mappedRecordCount: number;
  mappedCapacityMwe: number;
  mappedPotentialMinMwe: number;
  countryCount: number;
  regionCount: number;
};

type MapSearchParams = {
  country?: string;
  tge_region?: string;
  wb_region?: string;
};

const mapClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6 xl:px-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  neutral: "text-[var(--tge-governance-neutral-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  stat:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-3",
  action:
    "inline-flex h-10 items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  activeBadge:
    "mt-4 inline-flex min-h-8 items-center border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]",
  workflowCard:
    "block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4 hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]",
  scope:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-6 py-3 xl:px-8",
  separator: "mx-2 text-[var(--tge-governance-muted-border)]",
  softNotice:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-4 py-3 text-xs leading-5 text-[var(--tge-governance-neutral-text)]",
};

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function getMapFilters(params: MapSearchParams): PostgresPreviewGeographyFilters {
  return {
    country: cleanParam(params.country),
    tgeRegion: cleanParam(params.tge_region),
    wbRegion: cleanParam(params.wb_region),
  };
}

function geographyQuery(filters: PostgresPreviewGeographyFilters) {
  const params = new URLSearchParams();

  if (filters.country) params.set("country", filters.country);
  if (filters.tgeRegion) params.set("tge_region", filters.tgeRegion);
  if (filters.wbRegion) params.set("wb_region", filters.wbRegion);

  return params;
}

function geographyLabel(filters: PostgresPreviewGeographyFilters) {
  if (filters.country) return `Market: ${filters.country}`;
  if (filters.tgeRegion) return `TGE region: ${filters.tgeRegion}`;
  if (filters.wbRegion) return `World Bank region: ${filters.wbRegion}`;

  return null;
}

function geographyHref(path: string, filters: PostgresPreviewGeographyFilters) {
  const query = geographyQuery(filters).toString();

  return `${path}${query ? `?${query}` : ""}`;
}

async function getMapSummary(
  filters: PostgresPreviewGeographyFilters
): Promise<MapSummary | null> {
  try {
    const data = await listPostgresPreviewMapGroups(filters);
    const allGroups = [...data.plants, ...data.projects];
    const countries = new Set(
      allGroups.map((group) => group.country).filter(Boolean)
    );
    const regions = new Set(
      allGroups.map((group) => group.region).filter(Boolean)
    );

    return {
      plantGroupCount: data.plants.length,
      projectGroupCount: data.projects.length,
      mappedRecordCount: allGroups.reduce(
        (sum, group) => sum + group.record_count,
        0
      ),
      mappedCapacityMwe: allGroups.reduce(
        (sum, group) => sum + (group.total_capacity_mw || 0),
        0
      ),
      mappedPotentialMinMwe: data.projects.reduce(
        (sum, group) => sum + (group.potential_min_mw || 0),
        0
      ),
      countryCount: countries.size,
      regionCount: regions.size,
    };
  } catch {
    return null;
  }
}

function getSummaryStats(summary: MapSummary | null) {
  if (!summary) return [];

  return [
    {
      label: "Mapped MWe",
      value: `${formatMw(summary.mappedCapacityMwe)} MWe`,
      note: "Coordinate-confirmed capacity",
    },
    {
      label: "Mapped Sites",
      value: formatCount(summary.mappedRecordCount),
      note: `${formatCount(summary.plantGroupCount)} plant groups | ${formatCount(
        summary.projectGroupCount
      )} project groups`,
    },
    {
      label: "Markets",
      value: formatCount(summary.countryCount),
      note: `${formatCount(summary.regionCount)} TGE regions represented`,
    },
    {
      label: "Project Potential",
      value: `${formatMw(summary.mappedPotentialMinMwe)} MWe`,
      note: "Mapped minimum project potential",
    },
  ];
}

function MapStatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={mapClass.stat}>
      <div className={mapClass.label}>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold leading-none ${mapClass.title}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${mapClass.muted}`}>{note}</div>
    </div>
  );
}

function MapWorkflowCard({
  title,
  label,
  description,
  href,
  tone,
}: {
  title: string;
  label: string;
  description: string;
  href: string;
  tone: "success" | "attention" | "info";
}) {
  return (
    <Link
      href={href}
      className={mapClass.workflowCard}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={`text-sm font-bold ${mapClass.title}`}>{title}</div>
        <PostgresStatusBadge label={label} tone={tone} value={label} />
      </div>
      <p className={`mt-2 text-xs leading-5 ${mapClass.body}`}>{description}</p>
    </Link>
  );
}

export default async function PostgresPreviewMapPage({
  searchParams,
}: {
  searchParams?: Promise<MapSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = getMapFilters(resolvedSearchParams);
  const activeGeographyLabel = geographyLabel(filters);
  const mapApiPath = geographyHref("/api/postgres-preview/map", filters);
  const summary = await getMapSummary(filters);
  const summaryStats = getSummaryStats(summary);

  return (
    <main className="space-y-6">
      <section className={mapClass.panel}>
        <div className={mapClass.hero}>
          <p className={mapClass.kicker}>
            Spatial Intelligence
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${mapClass.title} xl:text-[2.75rem]`}>
                Map Explorer
              </h1>
              <p className={`mt-3 max-w-4xl text-base leading-7 ${mapClass.body}`}>
                Coordinate-confirmed geothermal projects and plants, with
                filters kept secondary so the spatial intelligence layer remains
                the primary surface.
              </p>
              {activeGeographyLabel ? (
                <div className={mapClass.activeBadge}>
                  Active view: {activeGeographyLabel}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={mapClass.action}
                href="/postgres-preview"
              >
                Back to Command Center
              </Link>
              <Link
                className={mapClass.action}
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>

        <div className={mapClass.scope}>
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${mapClass.neutral}`}>
            <span className={`font-semibold uppercase tracking-wide ${mapClass.muted}`}>
              Map Scope
            </span>
            <span>
              <span className={`font-medium ${mapClass.title}`}>Source</span>
              <span className={mapClass.separator}>|</span>
              Current platform data
            </span>
            <span>
              <span className={`font-medium ${mapClass.title}`}>Layers</span>
              <span className={mapClass.separator}>|</span>
              Projects and Plants
            </span>
            {activeGeographyLabel ? (
              <span>
                <span className={`font-medium ${mapClass.title}`}>Geography</span>
                <span className={mapClass.separator}>|</span>
                {activeGeographyLabel}
              </span>
            ) : null}
            <span>
              <span className={`font-medium ${mapClass.title}`}>Missing Coordinates</span>
              <span className={mapClass.separator}>|</span>
              Managed in Research Ops
            </span>
          </div>
        </div>
      </section>

      <section id="map-view" className="space-y-3 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Spatial Explorer"
          description="Use marker popups for record drilldown. Open filters only when you need to narrow the spatial view."
          tone="core"
        />
        <GroupedMap
          allCountriesLabel="All Markets"
          apiPath={mapApiPath}
          countryFilterLabel="Market"
          detailPathMode="postgres-preview"
          regionFilterLabel="TGE Region"
        />
      </section>

      {summaryStats.length > 0 ? (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <MapStatCard
              key={stat.label}
              label={stat.label}
              note={stat.note}
              value={stat.value}
            />
          ))}
        </section>
      ) : (
        <section className={mapClass.softNotice}>
          <span className={`font-semibold ${mapClass.title}`}>
            Map summary unavailable.
          </span>{" "}
          The map can still load from the API; check local PostgreSQL variables
          only if markers remain empty.
        </section>
      )}

      <section id="map-workflow" className="space-y-4 scroll-mt-24">
        <DetailPriorityMarker
          label="Workflow"
          title="Spatial Governance Paths"
          description="Coordinate cleanup, market context, and record drilldowns remain connected to the governed research system."
          tone="workflow"
        />
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MapWorkflowCard
            description="Review projects and plants that cannot appear on coordinate-confirmed map layers yet."
            href="/postgres-preview/research-ops?queue=missing_coordinates"
            label="Action"
            title="Missing Coordinates"
            tone="attention"
          />
          <MapWorkflowCard
            description="Filter project profiles missing coordinates."
            href={`${geographyHref("/postgres-preview/projects", filters)}${
              geographyQuery(filters).toString() ? "&" : "?"
            }missing=coordinates`}
            label="Projects"
            title="Project Coordinate Queue"
            tone="info"
          />
          <MapWorkflowCard
            description="Filter plant profiles missing coordinates."
            href={`${geographyHref("/postgres-preview/operating-assets", filters)}${
              geographyQuery(filters).toString() ? "&" : "?"
            }missing=coordinates`}
            label="Plants"
            title="Plant Coordinate Queue"
            tone="info"
          />
          <MapWorkflowCard
            description="Open the TGE-first regional market layer behind the spatial view."
            href={`${geographyHref("/postgres-preview/markets", filters)}#region-drilldown`}
            label="Markets"
            title={activeGeographyLabel || "Market Context"}
            tone="success"
          />
        </section>
      </section>
    </main>
  );
}
