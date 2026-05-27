import Link from "next/link";
import { getDb } from "@/lib/db";
import RegionsTable from "@/components/markets/RegionsTable";

export type RegionRow = {
  region: string;
  installed_mw: number;
  operating_mw: number;
  plant_count: number;
  planned_mw: number;
  project_count: number;
};

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default async function MarketsRegionsPage() {
  const db = await getDb();

  const plantRows = (await db.all(`
    SELECT
      region,
      SUM(COALESCE(installed_capacity_mw,0)) AS installed_mw,
      SUM(COALESCE(capacity_running_mw,0)) AS operating_mw,
      COUNT(*) AS plant_count
    FROM plants
    WHERE region IS NOT NULL AND TRIM(region) != ''
    GROUP BY region
  `)) as Array<{
    region: string;
    installed_mw: number;
    operating_mw: number;
    plant_count: number;
  }>;

  const projectRows = (await db.all(`
    SELECT
      region,
      SUM(COALESCE(installed_capacity_mw,0)) AS planned_mw,
      COUNT(*) AS project_count
    FROM projects
    WHERE region IS NOT NULL AND TRIM(region) != ''
    GROUP BY region
  `)) as Array<{
    region: string;
    planned_mw: number;
    project_count: number;
  }>;

  const mergedMap = new Map<string, RegionRow>();

  for (const row of plantRows) {
    mergedMap.set(row.region, {
      region: row.region,
      installed_mw: Number(row.installed_mw || 0),
      operating_mw: Number(row.operating_mw || 0),
      plant_count: Number(row.plant_count || 0),
      planned_mw: 0,
      project_count: 0,
    });
  }

  for (const row of projectRows) {
    const existing = mergedMap.get(row.region) || {
      region: row.region,
      installed_mw: 0,
      operating_mw: 0,
      plant_count: 0,
      planned_mw: 0,
      project_count: 0,
    };

    existing.planned_mw = Number(row.planned_mw || 0);
    existing.project_count = Number(row.project_count || 0);
    mergedMap.set(row.region, existing);
  }

  const regions = Array.from(mergedMap.values()).sort((a, b) =>
    a.region.localeCompare(b.region)
  );

  const totalInstalled = regions.reduce((sum, row) => sum + row.installed_mw, 0);
  const totalOperating = regions.reduce((sum, row) => sum + row.operating_mw, 0);
  const totalPlanned = regions.reduce((sum, row) => sum + row.planned_mw, 0);
  const totalPlants = regions.reduce((sum, row) => sum + row.plant_count, 0);
  const totalProjects = regions.reduce((sum, row) => sum + row.project_count, 0);

  return (
    <main className="space-y-8">
      <div className="mb-4">
        <Link
          href="/markets"
          className="text-sm font-semibold text-[#8dc63f] hover:underline"
        >
          ← Back to Markets
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Markets
            </p>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Regions
            </h1>

            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              Regional market overview pages derived from TGE’s geothermal
              plants and projects databases, combining installed capacity,
              operating capacity, project pipeline, and country-market aggregation.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>{regions.length} Regions</span>
            <span className="text-gray-300">|</span>
            <span>{totalPlants} Plant Records</span>
            <span className="text-gray-300">|</span>
            <span>{totalProjects} Project Records</span>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Regions
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {regions.length}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Regional market drilldowns
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Installed Capacity
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(totalInstalled)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Total plant installed MW
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Operating Capacity
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(totalOperating)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Total plant operating MW
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Planned Capacity
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(totalPlanned)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Total project planned MW
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Project Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {totalProjects}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Development pipeline records
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Regional Market Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Browse regional market pages with installed and operating capacity,
            project pipeline, and linked regional detail pages.
          </p>
        </div>

        <RegionsTable regions={regions} />
      </section>
    </main>
  );
}
