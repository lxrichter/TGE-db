import Link from "next/link";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";
import RegionOverviewMap from "@/components/RegionOverviewMap";
import RelatedNewsCard from "@/components/detail/RelatedNewsCard";
import {
  MarketPhaseOverviewCard,
  MarketStatBlock,
  marketDetailClass,
} from "@/components/markets/MarketDetailChrome";
import PhaseBadge, { normalizePhaseName } from "@/components/ui/PhaseBadge";
import ResearchStatusBadge from "@/components/ui/ResearchStatusBadge";

type PlantRow = {
  plant_id: string;
  plant_name: string | null;
  country: string | null;
  region: string | null;
  owner_operator: string | null;
  installed_capacity_mw: number | null;
  capacity_running_mw: number | null;
  project_phase: string | null;
  plant_technology: string | null;
  research_status: string | null;
  location_x: number | null;
  location_y: number | null;
};

type ProjectRow = {
  project_id: string;
  project_name: string | null;
  country: string | null;
  region: string | null;
  owner_operator: string | null;
  installed_capacity_mw: number | null;
  potential_min_mw: number | null;
  project_phase: string | null;
  plant_technology: string | null;
  research_status: string | null;
  location_x: number | null;
  location_y: number | null;
};

type CountrySummaryRow = {
  country: string;
  installed_mw: number;
  operating_mw: number;
  plant_count: number;
  planned_mw: number;
  project_count: number;
};

const PHASE_ORDER = [
  "Prospect",
  "TBD",
  "Exploration",
  "Pre-Feasibility",
  "Feasibility",
  "Construction",
  "Operating",
  "Cancelled",
  "Suspended",
  "Stalled",
] as const;

type PhaseName = (typeof PHASE_ORDER)[number];

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default async function RegionMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await getDb();

  const regionCandidates = (await db.all(`
    SELECT region FROM plants WHERE region IS NOT NULL AND TRIM(region) != ''
    UNION
    SELECT region FROM projects WHERE region IS NOT NULL AND TRIM(region) != ''
  `)) as Array<{ region: string }>;

  const matchedRegion = regionCandidates.find(
    (row) => slugify(row.region) === slug
  )?.region;

  if (!matchedRegion) {
    return (
      <main className="space-y-6">
        <div className={`${marketDetailClass.panel} p-8`}>
          <p className="text-base text-[var(--tge-governance-neutral-text)]">
            Region not found.
          </p>
          <Link
            href="/markets/regions"
            className={`mt-4 inline-block ${marketDetailClass.backLink}`}
          >
            ← Back to regions
          </Link>
        </div>
      </main>
    );
  }

  const plants = (await db.all(
    `
    SELECT
      plant_id,
      plant_name,
      country,
      region,
      owner_operator,
      installed_capacity_mw,
      capacity_running_mw,
      project_phase,
      plant_technology,
      research_status,
      location_x,
      location_y
    FROM plants
    WHERE region = ?
    ORDER BY country ASC, plant_name ASC
    `,
    matchedRegion
  )) as PlantRow[];

  const projects = (await db.all(
    `
    SELECT
      project_id,
      project_name,
      country,
      region,
      owner_operator,
      installed_capacity_mw,
      potential_min_mw,
      project_phase,
      plant_technology,
      research_status,
      location_x,
      location_y
    FROM projects
    WHERE region = ?
    ORDER BY country ASC, project_name ASC
    `,
    matchedRegion
  )) as ProjectRow[];

  const totalInstalled = plants.reduce(
    (sum, row) => sum + Number(row.installed_capacity_mw || 0),
    0
  );

  const totalOperating = plants.reduce(
    (sum, row) => sum + Number(row.capacity_running_mw || 0),
    0
  );

  const totalPlanned = projects.reduce(
    (sum, row) => sum + Number(row.installed_capacity_mw || 0),
    0
  );

  const countrySet = new Set<string>();
  plants.forEach((p) => p.country && countrySet.add(p.country));
  projects.forEach((p) => p.country && countrySet.add(p.country));

  const phaseStats: Record<
    PhaseName,
    { count: number; mw: number; mwLabel: string }
  > = {
    Prospect: { count: 0, mw: 0, mwLabel: "Min MWe" },
    Exploration: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    "Pre-Feasibility": { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Feasibility: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Construction: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Operating: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    TBD: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Cancelled: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Suspended: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Stalled: { count: 0, mw: 0, mwLabel: "Planned MWe" },
  };

  projects.forEach((row) => {
    const normalized = normalizePhaseName(row.project_phase);
    const phase = (
      PHASE_ORDER.includes(normalized as PhaseName) ? normalized : "TBD"
    ) as PhaseName;

    phaseStats[phase].count += 1;
    phaseStats[phase].mw +=
      phase === "Prospect"
        ? Number(row.potential_min_mw || 0)
        : Number(row.installed_capacity_mw || 0);
  });

  const countryMap = new Map<string, CountrySummaryRow>();

  plants.forEach((row) => {
    const country = row.country || "NA";
    const existing = countryMap.get(country) || {
      country,
      installed_mw: 0,
      operating_mw: 0,
      plant_count: 0,
      planned_mw: 0,
      project_count: 0,
    };

    existing.installed_mw += Number(row.installed_capacity_mw || 0);
    existing.operating_mw += Number(row.capacity_running_mw || 0);
    existing.plant_count += 1;

    countryMap.set(country, existing);
  });

  projects.forEach((row) => {
    const country = row.country || "NA";
    const existing = countryMap.get(country) || {
      country,
      installed_mw: 0,
      operating_mw: 0,
      plant_count: 0,
      planned_mw: 0,
      project_count: 0,
    };

    existing.planned_mw += Number(row.installed_capacity_mw || 0);
    existing.project_count += 1;

    countryMap.set(country, existing);
  });

  const countrySummary = Array.from(countryMap.values()).sort((a, b) =>
    a.country.localeCompare(b.country)
  );

  const operatorMap = new Map<
    string,
    {
      name: string;
      plants: number;
      projects: number;
      installed_mw: number;
      operating_mw: number;
    }
  >();

  plants.forEach((row) => {
    const name = (row.owner_operator || "").trim();
    if (!name) return;

    const existing = operatorMap.get(name) || {
      name,
      plants: 0,
      projects: 0,
      installed_mw: 0,
      operating_mw: 0,
    };

    existing.plants += 1;
    existing.installed_mw += Number(row.installed_capacity_mw || 0);
    existing.operating_mw += Number(row.capacity_running_mw || 0);

    operatorMap.set(name, existing);
  });

  projects.forEach((row) => {
    const name = (row.owner_operator || "").trim();
    if (!name) return;

    const existing = operatorMap.get(name) || {
      name,
      plants: 0,
      projects: 0,
      installed_mw: 0,
      operating_mw: 0,
    };

    existing.projects += 1;
    operatorMap.set(name, existing);
  });

  const leadingOperators = Array.from(operatorMap.values())
    .sort((a, b) => b.operating_mw - a.operating_mw)
    .slice(0, 8);

  const technologyMap = new Map<string, number>();
  plants.forEach((row) => {
    const tech = (row.plant_technology || "NA").trim() || "NA";
    technologyMap.set(
      tech,
      (technologyMap.get(tech) || 0) + Number(row.installed_capacity_mw || 0)
    );
  });

  const technologyMix = Array.from(technologyMap.entries())
    .map(([technology, mw]) => ({ technology, mw }))
    .sort((a, b) => b.mw - a.mw);

  const needInfoCount =
    plants.filter((p) => (p.research_status || "").toLowerCase().includes("need"))
      .length +
    projects.filter((p) => (p.research_status || "").toLowerCase().includes("need"))
      .length;

  const mapPoints = [
    ...plants.map((p) => ({
      id: p.plant_id,
      name: p.plant_name || "Plant",
      latitude: p.location_x,
      longitude: p.location_y,
      type: "plant" as const,
      phase: p.project_phase,
      capacity: p.installed_capacity_mw,
      country: p.country,
    })),
    ...projects.map((p) => ({
      id: p.project_id,
      name: p.project_name || "Project",
      latitude: p.location_x,
      longitude: p.location_y,
      type: "project" as const,
      phase: p.project_phase,
      capacity: p.installed_capacity_mw,
      potentialMinMw: p.potential_min_mw,
      country: p.country,
    })),
  ];

  return (
    <main className="space-y-8">
      <div>
        <Link
          href="/markets/regions"
          className={marketDetailClass.backLink}
        >
          ← Back to regions
        </Link>
      </div>

      <section className={marketDetailClass.panel}>
        <div className={marketDetailClass.heroAccent}>
          <div className="max-w-5xl">
            <p className={marketDetailClass.eyebrow}>
              Market Overview
            </p>
            <h1 className={marketDetailClass.heroTitle}>
              {matchedRegion}
            </h1>
            <p className={`mt-4 text-lg leading-8 ${marketDetailClass.bodyText}`}>
              Regional geothermal market view with installed and operating
              capacity, project pipeline, country-market summaries, plant maps,
              and structured plant and project profiles across the region.
            </p>
          </div>
        </div>

        <div className={marketDetailClass.summaryBar}>
          <div className={marketDetailClass.summaryItems}>
            <span className={marketDetailClass.summaryLabel}>
              Summary
            </span>
            <span>{countrySet.size} Country Markets</span>
            <span className={marketDetailClass.divider}>|</span>
            <span>{plants.length} Plants</span>
            <span className={marketDetailClass.divider}>|</span>
            <span>{projects.length} Projects</span>
          </div>
        </div>

        <div className={marketDetailClass.statStrip}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-5">
            <MarketStatBlock
              title="Installed Capacity"
              value={formatNumber(totalInstalled)}
              subtitle="Total plant installed MWe"
            />
            <MarketStatBlock
              title="Operating Capacity"
              value={formatNumber(totalOperating)}
              subtitle="Total plant operating MWe"
            />
            <MarketStatBlock
              title="Country Markets"
              value={countrySet.size}
              subtitle="Markets in region"
            />
            <MarketStatBlock
              title="Planned Capacity"
              value={formatNumber(totalPlanned)}
              subtitle="Total planned project MWe"
            />
            <MarketStatBlock
              title="Projects"
              value={projects.length}
              subtitle="Development pipeline projects"
            />
          </div>
        </div>
      </section>

      <section className={marketDetailClass.panel}>
        <div className={marketDetailClass.sectionHeader}>
          <h2 className={marketDetailClass.sectionTitle}>
            Development Phase Overview
          </h2>
          <p className={marketDetailClass.helperText}>
            Count of geothermal power projects in development in {matchedRegion}.
            Prospect uses minimum capacity, all other phases use planned installed
            capacity.
          </p>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-8">
            {PHASE_ORDER.map((phase) => (
              <MarketPhaseOverviewCard
                key={phase}
                phase={phase}
                count={phaseStats[phase].count}
                mw={phaseStats[phase].mw}
                mwLabel={phaseStats[phase].mwLabel}
              />
            ))}
          </div>
        </div>
      </section>

      <RegionOverviewMap region={matchedRegion} points={mapPoints} />

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>
                Country Markets in Region
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={marketDetailClass.tableHead}>
                  <tr>
                    <th className={marketDetailClass.th}>
                      Market
                    </th>
                    <th className={marketDetailClass.th}>
                      Installed MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      Operating MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      # Plants
                    </th>
                    <th className={marketDetailClass.th}>
                      Planned MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      # Projects
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {countrySummary.map((row) => (
                    <tr key={row.country} className={marketDetailClass.row}>
                      <td className={marketDetailClass.td}>
                        <Link
                          href={`/markets/countries/${slugify(row.country)}`}
                          className={marketDetailClass.linkStrong}
                        >
                          {row.country}
                        </Link>
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(row.installed_mw)}
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(row.operating_mw)}
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.plant_count}
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(row.planned_mw)}
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.project_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>Power Plants</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={marketDetailClass.tableHead}>
                  <tr>
                    <th className={marketDetailClass.th}>
                      Plant
                    </th>
                    <th className={marketDetailClass.th}>
                      Country
                    </th>
                    <th className={marketDetailClass.th}>
                      Operator
                    </th>
                    <th className={marketDetailClass.th}>
                      Installed MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      Operating MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      Technology
                    </th>
                    <th className={marketDetailClass.th}>
                      Research
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((row) => (
                    <tr key={row.plant_id} className={marketDetailClass.row}>
                      <td className={marketDetailClass.td}>
                        <Link
                          href={`/plants/${row.plant_id}`}
                          className={marketDetailClass.linkStrong}
                        >
                          {row.plant_name || "NA"}
                        </Link>
                      </td>
                      <td className={marketDetailClass.td}>
                        <Link
                          href={`/markets/countries/${slugify(row.country || "")}`}
                          className={marketDetailClass.link}
                        >
                          {row.country || "NA"}
                        </Link>
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.owner_operator || "NA"}
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(Number(row.installed_capacity_mw || 0))}
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(Number(row.capacity_running_mw || 0))}
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.plant_technology || "NA"}
                      </td>
                      <td className={marketDetailClass.td}>
                        <ResearchStatusBadge value={row.research_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>Projects</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={marketDetailClass.tableHead}>
                  <tr>
                    <th className={marketDetailClass.th}>
                      Project
                    </th>
                    <th className={marketDetailClass.th}>
                      Country
                    </th>
                    <th className={marketDetailClass.th}>
                      Operator
                    </th>
                    <th className={marketDetailClass.th}>
                      Planned MWe
                    </th>
                    <th className={marketDetailClass.th}>
                      Phase
                    </th>
                    <th className={marketDetailClass.th}>
                      Technology
                    </th>
                    <th className={marketDetailClass.th}>
                      Research
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((row) => (
                    <tr key={row.project_id} className={marketDetailClass.row}>
                      <td className={marketDetailClass.td}>
                        <Link
                          href={`/projects/${row.project_id}`}
                          className={marketDetailClass.linkStrong}
                        >
                          {row.project_name || "NA"}
                        </Link>
                      </td>
                      <td className={marketDetailClass.td}>
                        <Link
                          href={`/markets/countries/${slugify(row.country || "")}`}
                          className={marketDetailClass.link}
                        >
                          {row.country || "NA"}
                        </Link>
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.owner_operator || "NA"}
                      </td>
                      <td className={marketDetailClass.td}>
                        {formatNumber(Number(row.installed_capacity_mw || 0))}
                      </td>
                      <td className={marketDetailClass.td}>
                        <PhaseBadge value={row.project_phase} />
                      </td>
                      <td className={marketDetailClass.td}>
                        {row.plant_technology || "NA"}
                      </td>
                      <td className={marketDetailClass.td}>
                        <ResearchStatusBadge value={row.research_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>
                Leading Operators
              </h2>
            </div>
            <div className="p-6">
              {leadingOperators.length === 0 ? (
                <div className={marketDetailClass.emptyText}>
                  No operator data found.
                </div>
              ) : (
                <div className="space-y-3">
                  {leadingOperators.map((row) => (
                    <div
                      key={row.name}
                      className={marketDetailClass.listRow}
                    >
                      <div className={marketDetailClass.listTitle}>{row.name}</div>
                      <div className={marketDetailClass.listMeta}>
                        Plants: {row.plants} | MWe: {formatNumber(row.operating_mw)} |
                        Projects: {row.projects}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>
                Technology Mix
              </h2>
            </div>
            <div className="p-6">
              {technologyMix.length === 0 ? (
                <div className={marketDetailClass.emptyText}>
                  No plant technology data found.
                </div>
              ) : (
                <div className="space-y-3">
                  {technologyMix.map((row) => (
                    <div
                      key={row.technology}
                      className={marketDetailClass.listRow}
                    >
                      <div className={marketDetailClass.listTitle}>
                        {row.technology}
                      </div>
                      <div className={marketDetailClass.listMeta}>
                        Installed MWe: {formatNumber(row.mw)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={marketDetailClass.panel}>
            <div className={marketDetailClass.sectionHeaderMuted}>
              <h2 className={marketDetailClass.sectionTitle}>
                Data Quality Snapshot
              </h2>
            </div>
            <div className={marketDetailClass.noteBody}>
              <div>Total profiles: {plants.length + projects.length}</div>
              <div className="mt-2">Need Info profiles: {needInfoCount}</div>
              <div className="mt-2">Plant profiles: {plants.length}</div>
              <div className="mt-2">Project profiles: {projects.length}</div>
            </div>
          </section>

          <RelatedNewsCard name={matchedRegion} />
        </div>
      </section>
    </main>
  );
}
