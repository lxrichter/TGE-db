import Link from "next/link";
import { getDb } from "@/lib/db";
import CountriesTable from "@/components/markets/CountriesTable";

export type CountryRow = {
  country: string;
  region: string;
  installed_mw: number;
  operating_mw: number;
  plant_count: number;
  planned_mw: number;
  project_count: number;
};

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const brandLinkClass =
  "text-[var(--tge-brand-green-dark)] hover:underline";

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function MarketMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div>
      <div className={eyebrowClass}>{label}</div>
      <div className={`mt-1 text-3xl font-bold ${titleTextClass}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
        {note}
      </div>
    </div>
  );
}

export default async function MarketsCountriesPage() {
  const db = await getDb();

  const plantRows = (await db.all(`
    SELECT
      country,
      region,
      SUM(COALESCE(installed_capacity_mw, 0)) AS installed_mw,
      SUM(COALESCE(capacity_running_mw, 0)) AS operating_mw,
      COUNT(*) AS plant_count
    FROM plants
    WHERE country IS NOT NULL AND TRIM(country) != ''
    GROUP BY country, region
  `)) as Array<{
    country: string;
    region: string;
    installed_mw: number;
    operating_mw: number;
    plant_count: number;
  }>;

  const projectRows = (await db.all(`
    SELECT
      country,
      region,
      SUM(COALESCE(installed_capacity_mw, 0)) AS planned_mw,
      COUNT(*) AS project_count
    FROM projects
    WHERE country IS NOT NULL AND TRIM(country) != ''
    GROUP BY country, region
  `)) as Array<{
    country: string;
    region: string;
    planned_mw: number;
    project_count: number;
  }>;

  const mergedMap = new Map<string, CountryRow>();

  for (const row of plantRows) {
    mergedMap.set(row.country, {
      country: row.country,
      region: row.region || "NA",
      installed_mw: Number(row.installed_mw || 0),
      operating_mw: Number(row.operating_mw || 0),
      plant_count: Number(row.plant_count || 0),
      planned_mw: 0,
      project_count: 0,
    });
  }

  for (const row of projectRows) {
    const existing = mergedMap.get(row.country) || {
      country: row.country,
      region: row.region || "NA",
      installed_mw: 0,
      operating_mw: 0,
      plant_count: 0,
      planned_mw: 0,
      project_count: 0,
    };

    existing.region = existing.region || row.region || "NA";
    existing.planned_mw = Number(row.planned_mw || 0);
    existing.project_count = Number(row.project_count || 0);

    mergedMap.set(row.country, existing);
  }

  const countries = Array.from(mergedMap.values()).sort((a, b) =>
    a.country.localeCompare(b.country)
  );

  const totalInstalled = countries.reduce((sum, row) => sum + row.installed_mw, 0);
  const totalOperating = countries.reduce((sum, row) => sum + row.operating_mw, 0);
  const totalPlanned = countries.reduce((sum, row) => sum + row.planned_mw, 0);
  const totalPlants = countries.reduce((sum, row) => sum + row.plant_count, 0);
  const totalProjects = countries.reduce((sum, row) => sum + row.project_count, 0);

  const regionSet = new Set(countries.map((row) => row.region).filter(Boolean));

  return (
    <main className="space-y-8">
      <div className="mb-4">
        <Link
          href="/markets"
          className={`text-sm font-semibold ${brandLinkClass}`}
        >
          ← Back to Markets
        </Link>
      </div>

      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
              Markets
            </p>

            <h1 className={`mt-3 text-5xl font-bold tracking-tight ${titleTextClass}`}>
              Country Markets
            </h1>

            <p className={`mt-4 max-w-5xl text-lg leading-8 ${bodyTextClass}`}>
              Country-market overview pages derived from TGE’s geothermal
              plants and projects databases, covering installed capacity,
              operating capacity, project pipeline, and structured market profiles.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${bodyTextClass}`}>
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Scope
            </span>
            <span>{countries.length} Markets</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>{regionSet.size} Regions</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>{totalPlants} Plants</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>{totalProjects} Projects</span>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-5">
            <MarketMetric
              label="Markets"
              value={countries.length}
              note="Country-market pages"
            />
            <MarketMetric
              label="Installed Capacity"
              value={formatNumber(totalInstalled)}
              note="Total plant installed MWe"
            />
            <MarketMetric
              label="Operating Capacity"
              value={formatNumber(totalOperating)}
              note="Total plant operating MWe"
            />
            <MarketMetric
              label="Planned Capacity"
              value={formatNumber(totalPlanned)}
              note="Total project planned MWe"
            />
            <MarketMetric
              label="Projects"
              value={totalProjects}
              note="Development pipeline projects"
            />
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-6 py-4`}>
          <h2 className={`text-xl font-bold ${titleTextClass}`}>
            Country Market Overview
          </h2>
          <p className={`mt-1 text-sm ${bodyTextClass}`}>
            Browse country market pages with installed and operating capacity,
            project pipeline, and linked detail pages.
          </p>
        </div>

        <CountriesTable countries={countries} />
      </section>
    </main>
  );
}
