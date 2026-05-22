import Link from "next/link";
import GroupedMap from "@/components/GroupedMap";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";
import { formatCount, formatMw } from "@/lib/format";
import { listPostgresPreviewMapGroups } from "@/lib/postgres-preview";
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

async function getMapSummary(): Promise<MapSummary | null> {
  try {
    const data = await listPostgresPreviewMapGroups();
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
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
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
      className="block border border-gray-200 bg-white px-4 py-4 hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="text-sm font-bold text-[#1f2937]">{title}</div>
        <PostgresStatusBadge label={label} tone={tone} value={label} />
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
    </Link>
  );
}

export default async function PostgresPreviewMapPage() {
  const summary = await getMapSummary();

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                PostgreSQL Map Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Coordinate-confirmed project and plant/facility groups. Records
                without coordinates stay in Research Ops queues.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Map Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Source</span>
              <span className="mx-2 text-gray-300">|</span>
              PostgreSQL staging
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Layers</span>
              <span className="mx-2 text-gray-300">|</span>
              Projects and Plants / Facilities
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Missing Coordinates</span>
              <span className="mx-2 text-gray-300">|</span>
              Managed in Research Ops
            </span>
          </div>
        </div>
      </section>

      <NextActionStrip
        description="From the map, users should either open the spatial record, clean missing coordinates, or interpret the market pattern."
        actions={[
          {
            label: "Spatial Intelligence",
            title: "Use marker popups",
            description: "Open project and plant/facility records directly from coordinate-confirmed marker groups.",
            href: "#map-view",
          },
          {
            label: "Operational Queue",
            title: "Fix missing coordinates",
            description: "Route records without usable coordinates back through Research Ops cleanup.",
            href: "#map-workflow",
          },
          {
            label: "Market Context",
            title: "Open country signals",
            description: "Move from spatial clusters into country and regional market intelligence.",
            href: "/postgres-preview/countries",
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
          description="Only records with usable coordinates appear here."
          tone="core"
        />

        {summary ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <MapStatCard
              label="Plant Groups"
              note="Operating asset groups"
              value={formatCount(summary.plantGroupCount)}
            />
            <MapStatCard
              label="Project Groups"
              note="Development groups"
              value={formatCount(summary.projectGroupCount)}
            />
            <MapStatCard
              label="Mapped Records"
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
          <section className="border border-amber-200 bg-amber-50 px-5 py-5">
            <h2 className="text-lg font-bold text-amber-900">
              Map Summary Not Available
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
              The map can still attempt to load from the API. Start the app with
              local PostgreSQL variables if the map remains empty.
            </p>
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
        <section className="grid gap-3 md:grid-cols-3">
          <MapWorkflowCard
            description="Review projects and assets that cannot appear on coordinate-confirmed map layers yet."
            href="/postgres-preview/research-ops?queue=missing_coordinates"
            label="Action"
            title="Missing Coordinates"
            tone="attention"
          />
          <MapWorkflowCard
            description="Filter projects missing coordinates."
            href="/postgres-preview/projects?missing=coordinates"
            label="Projects"
            title="Project Coordinate Queue"
            tone="info"
          />
          <MapWorkflowCard
            description="Filter assets missing coordinates."
            href="/postgres-preview/operating-assets?missing=coordinates"
            label="Assets"
            title="Asset Coordinate Queue"
            tone="info"
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
          apiPath="/api/postgres-preview/map"
          detailPathMode="postgres-preview"
        />
      </section>
    </main>
  );
}
