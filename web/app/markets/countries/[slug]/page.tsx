import Link from "next/link";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";
import CountryOverviewMap from "@/components/CountryOverviewMap";
import RelatedNewsCard from "@/components/detail/RelatedNewsCard";
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

const PHASE_ORDER = [
  "Prospect",
  "Exploration",
  "Pre-Feasibility",
  "Feasibility",
  "Construction",
  "Stalled",
  "TBD",
  "Cancelled",
] as const;

type PhaseName = (typeof PHASE_ORDER)[number];

function StatBlock({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="mt-1 text-3xl font-bold text-[#1f2937]">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
    </div>
  );
}

function PhaseOverviewCard({
  phase,
  count,
  mw,
  mwLabel,
}: {
  phase: PhaseName;
  count: number;
  mw: number;
  mwLabel: string;
}) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <div>
        <PhaseBadge value={phase} />
      </div>

      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Projects
      </div>
      <div className="mt-1 text-[22px] font-bold leading-none text-[#1f2937]">
        {Number(count || 0).toLocaleString()}
      </div>

      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {mwLabel}
      </div>
      <div className="mt-1 text-[18px] font-bold leading-none text-[#1f2937]">
        {Number(mw || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
}

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default async function CountryMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await getDb();

  const countryCandidates = (await db.all(`
    SELECT country FROM plants WHERE country IS NOT NULL AND TRIM(country) != ''
    UNION
    SELECT country FROM projects WHERE country IS NOT NULL AND TRIM(country) != ''
  `)) as Array<{ country: string }>;

  const matchedCountry = countryCandidates.find(
    (row) => slugify(row.country) === slug
  )?.country;

  if (!matchedCountry) {
    return (
      <main className="space-y-6">
        <div className="border border-gray-200 bg-white p-8">
          <p className="text-base text-gray-700">Country market not found.</p>
          <Link
            href="/markets/countries"
            className="mt-4 inline-block text-sm text-[#8dc63f]"
          >
            ← Back to country markets
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
    WHERE country = ?
    ORDER BY plant_name ASC
  `,
    matchedCountry
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
    WHERE country = ?
    ORDER BY project_name ASC
  `,
    matchedCountry
  )) as ProjectRow[];

  const region =
    plants.find((p) => p.region)?.region ||
    projects.find((p) => p.region)?.region ||
    "NA";

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

  const phaseStats: Record<
    PhaseName,
    { count: number; mw: number; mwLabel: string }
  > = {
    Prospect: { count: 0, mw: 0, mwLabel: "Min MWe" },
    Exploration: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    "Pre-Feasibility": { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Feasibility: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Construction: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Stalled: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    TBD: { count: 0, mw: 0, mwLabel: "Planned MWe" },
    Cancelled: { count: 0, mw: 0, mwLabel: "Planned MWe" },
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

    const installedMw = Number(row.installed_capacity_mw || 0);
    const operatingMw = Number(row.capacity_running_mw || 0);

    const existing = operatorMap.get(name) || {
      name,
      plants: 0,
      projects: 0,
      installed_mw: 0,
      operating_mw: 0,
    };

    existing.plants += 1;
    existing.installed_mw += installedMw;
    existing.operating_mw += operatingMw;

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
    })),
  ];

  return (
    <main className="space-y-8">
      <div>
        <Link
          href="/markets/countries"
          className="text-sm font-medium text-[#8dc63f] hover:underline"
        >
          ← Back to country markets
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Market Overview
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              {matchedCountry}
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Country-market geothermal view with installed and operating
              capacity, project pipeline, asset map, operator landscape, and
              structured plant and project profiles.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Summary
            </span>
            <span>{region}</span>
            <span className="text-gray-300">|</span>
            <span>{plants.length} Plants</span>
            <span className="text-gray-300">|</span>
            <span>{projects.length} Projects</span>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-5">
            <StatBlock
              title="Installed Capacity"
              value={formatNumber(totalInstalled)}
              subtitle="Total plant installed MWe"
            />
            <StatBlock
              title="Operating Capacity"
              value={formatNumber(totalOperating)}
              subtitle="Total plant operating MWe"
            />
            <StatBlock
              title="Plants"
              value={plants.length}
              subtitle="Operating / tracked plants"
            />
            <StatBlock
              title="Planned Capacity"
              value={formatNumber(totalPlanned)}
              subtitle="Total planned project MWe"
            />
            <StatBlock
              title="Need Info"
              value={needInfoCount}
              subtitle="Profiles flagged for follow-up"
            />
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Development Phase Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Count of geothermal power projects in development in {matchedCountry}.
            Prospect uses minimum capacity, all other phases use planned installed
            capacity.
          </p>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-8">
            {PHASE_ORDER.map((phase) => (
              <PhaseOverviewCard
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

      <CountryOverviewMap country={matchedCountry} points={mapPoints} />

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">Power Plants</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Plant
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Operator
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Installed MWe
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Operating MWe
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Technology
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Research
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((row) => (
                    <tr key={row.plant_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <Link
                          href={`/plants/${row.plant_id}`}
                          className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {row.plant_name || "NA"}
                        </Link>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {row.owner_operator || "NA"}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {formatNumber(Number(row.installed_capacity_mw || 0))}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {formatNumber(Number(row.capacity_running_mw || 0))}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {row.plant_technology || "NA"}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <ResearchStatusBadge value={row.research_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">Projects</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Project
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Operator
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Planned MWe
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Phase
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Technology
                    </th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
                      Research
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((row) => (
                    <tr key={row.project_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <Link
                          href={`/projects/${row.project_id}`}
                          className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {row.project_name || "NA"}
                        </Link>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {row.owner_operator || "NA"}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {formatNumber(Number(row.installed_capacity_mw || 0))}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <PhaseBadge value={row.project_phase} />
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        {row.plant_technology || "NA"}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
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
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Leading Operators
              </h2>
            </div>
            <div className="p-6">
              {leadingOperators.length === 0 ? (
                <div className="text-sm text-gray-500">No operator data found.</div>
              ) : (
                <div className="space-y-3">
                  {leadingOperators.map((row) => (
                    <div
                      key={row.name}
                      className="border-b border-gray-200 pb-3 text-[13px]"
                    >
                      <div className="font-semibold text-[#1f2937]">{row.name}</div>
                      <div className="mt-1 text-gray-600">
                        Plants: {row.plants} | MWe: {formatNumber(row.operating_mw)} |
                        Projects: {row.projects}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Technology Mix
              </h2>
            </div>
            <div className="p-6">
              {technologyMix.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No plant technology data found.
                </div>
              ) : (
                <div className="space-y-3">
                  {technologyMix.map((row) => (
                    <div
                      key={row.technology}
                      className="border-b border-gray-200 pb-3 text-[13px]"
                    >
                      <div className="font-semibold text-[#1f2937]">
                        {row.technology}
                      </div>
                      <div className="mt-1 text-gray-600">
                        Installed MWe: {formatNumber(row.mw)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Data Quality Snapshot
              </h2>
            </div>
            <div className="p-6 text-[13px] text-gray-600">
              <div>Total profiles: {plants.length + projects.length}</div>
              <div className="mt-2">Need Info profiles: {needInfoCount}</div>
              <div className="mt-2">Plant profiles: {plants.length}</div>
              <div className="mt-2">Project profiles: {projects.length}</div>
            </div>
          </section>

          <RelatedNewsCard country={matchedCountry} />
        </div>
      </section>
    </main>
  );
}
