import Link from "next/link";
import GroupedMap from "@/components/GroupedMap";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";
import { formatCount, formatMw } from "@/lib/format";
import {
  listPostgresPreviewMapGroups,
  type PostgresPreviewGeographyFilters,
} from "@/lib/postgres-preview";
import NextActionStrip from "@/components/ui/NextActionStrip";

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
    "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  neutral: "text-[var(--tge-governance-neutral-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  stat:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4",
  action:
    "inline-flex h-10 items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  activeBadge:
    "mt-4 inline-flex min-h-8 items-center border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]",
  workflowCard:
    "block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4 hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]",
  scope:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-8 py-4",
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

  return (
    <main className="space-y-8">
      <section className={mapClass.panel}>
        <div className={mapClass.hero}>
          <p className={mapClass.kicker}>
            Spatial Intelligence
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${mapClass.title}`}>
                Map
              </h1>
              <p className={`mt-4 max-w-4xl text-base leading-7 ${mapClass.body}`}>
                Coordinate-confirmed spatial intelligence for projects and
                plants. Projects and plants without coordinates stay in
                Research Ops queues.
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

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the three main map workflows: markers, coordinate cleanup, and market context."
        actions={[
          {
            label: "Markers",
            title: "Use marker popups",
            description: "Open projects and plants from coordinate-confirmed marker groups.",
            href: "#map-view",
          },
          {
            label: "Coordinates",
            title: "Fix missing coordinates",
            description: "Route projects and plants without usable coordinates through Research Ops cleanup.",
            href: "#map-workflow",
          },
          {
            label: "Markets",
            title: activeGeographyLabel
              ? "Open filtered market context"
              : "Open market signals",
            description: "Move from spatial clusters into regional and market intelligence.",
            href: `${geographyHref("/postgres-preview/markets", filters)}#region-drilldown`,
          },
        ]}
      />

      <PostgresSectionJumpNav
        items={[
          { href: "#map-readiness", label: "Readiness", note: "Coverage" },
          { href: "#map-workflow", label: "Workflow", note: "Queues" },
          { href: "#map-view", label: "Map", note: "Spatial view" },
        ]}
      />

      <section id="map-readiness" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Coordinate-Confirmed Map Readiness"
          description="Only projects and plants with usable coordinates appear here."
          tone="core"
        />

        {summary ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <MapStatCard
              label="Plant Groups"
              note="Operating plant groups"
              value={formatCount(summary.plantGroupCount)}
            />
            <MapStatCard
              label="Project Groups"
              note="Development groups"
              value={formatCount(summary.projectGroupCount)}
            />
            <MapStatCard
              label="Mapped Sites"
              note="Represented by markers"
              value={formatCount(summary.mappedRecordCount)}
            />
            <MapStatCard
              label="Mapped MWe"
              note="Mapped group capacity"
              value={`${formatMw(summary.mappedCapacityMwe)} MWe`}
            />
            <MapStatCard
              label="Potential Min"
              note="Project potential"
              value={`${formatMw(summary.mappedPotentialMinMwe)} MWe`}
            />
            <MapStatCard
              label="Markets"
              note={`${formatCount(summary.regionCount)} regions`}
              value={formatCount(summary.countryCount)}
            />
          </section>
        ) : (
          <section className={mapClass.softNotice}>
            <span className={`font-semibold ${mapClass.title}`}>
              Map summary unavailable.
            </span>{" "}
            The map can still load from the API; check local PostgreSQL
            variables only if markers remain empty.
          </section>
        )}
      </section>

      <section id="map-workflow" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Workflow"
          title="Spatial Review Workflow"
          description="Map navigation connects back to governed coordinate cleanup."
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
            description="Filter projects missing coordinates."
            href={`${geographyHref("/postgres-preview/projects", filters)}${
              geographyQuery(filters).toString() ? "&" : "?"
            }missing=coordinates`}
            label="Projects"
            title="Project Coordinate Queue"
            tone="info"
          />
          <MapWorkflowCard
            description="Filter plants missing coordinates."
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
            label="Regions"
            title={activeGeographyLabel || "Regional Market Context"}
            tone="success"
          />
        </section>
      </section>

      <section id="map-view" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Spatial View"
          title="Map Navigation"
          description="Grouped markers with layer, geography, and basemap controls."
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
    </main>
  );
}
