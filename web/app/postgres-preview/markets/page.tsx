import Link from "next/link";
import type { ReactNode } from "react";
import {
  listPostgresCountryMarketSummaries,
  type PostgresCountryMarketSummary,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresPreviewSetupNotice } from "@/components/postgres-preview/PostgresPreviewListTables";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import {
  postgresStatusBarClass,
  postgresStatusToneClass,
} from "@/components/postgres-preview/PostgresStatusBadge";
import NextActionStrip from "@/components/ui/NextActionStrip";

export const dynamic = "force-dynamic";

type CountriesData =
  | {
      ok: true;
      countries: PostgresCountryMarketSummary[];
    }
  | {
      ok: false;
      error: string;
    };

type CountryMarketSearchParams = {
  country?: string | string[];
  tge_region?: string | string[];
  wb_region?: string | string[];
};

type RegionSummary = {
  name: string;
  kind: "tge" | "wb";
  countryCount: number;
  recordCount: number;
  operatingMwe: number;
  pipelineMwe: number;
  sourceGaps: number;
};

async function getCountriesData(): Promise<CountriesData> {
  try {
    const countries = await listPostgresCountryMarketSummaries();

    return {
      ok: true,
      countries,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function cleanParam(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();

  return trimmed || "";
}

function marketRegionHref(
  regionKind: RegionSummary["kind"],
  regionName: string
) {
  const params = new URLSearchParams();

  params.set(regionKind === "tge" ? "tge_region" : "wb_region", regionName);

  return `/postgres-preview/markets?${params.toString()}#market-rankings`;
}

function regionWorklistHref(
  path: string,
  regionKind: RegionSummary["kind"],
  regionName: string
) {
  const params = new URLSearchParams();

  params.set(regionKind === "tge" ? "tge_region" : "wb_region", regionName);

  return `${path}?${params.toString()}`;
}

function countryQueryHref(path: string, country: string) {
  const params = new URLSearchParams({ country });

  return `${path}?${params.toString()}`;
}

function countryWorklistHref(
  path: string,
  country: string,
  query?: Record<string, string | undefined>
) {
  const params = new URLSearchParams({ country });

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `${path}?${params.toString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value || value.startsWith("1970-01-01")) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function StatTile({
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
      <div className="mt-2 text-xl font-bold leading-none text-[#1f2937] sm:text-2xl">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function CoverageBar({
  approved,
  draft,
}: {
  approved: number;
  draft: number;
}) {
  const total = approved + draft;
  const approvedShare = total > 0 ? Math.round((approved / total) * 100) : 0;
  const barClass = postgresStatusBarClass("success");

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
        <span>{approvedShare}% reviewed</span>
        <span>
          {formatCount(approved)} / {formatCount(total)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-gray-100">
        <div
          className={`h-full ${barClass}`}
          style={{ width: `${approvedShare}%` }}
        />
      </div>
    </div>
  );
}

function MobileMarketField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function CountryReferenceMeta({
  country,
}: {
  country: PostgresCountryMarketSummary;
}) {
  const values = [country.iso3, country.tge_region, country.wb_region].filter(
    (value): value is string => Boolean(value)
  );

  if (values.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex min-h-6 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function CountryWorklistLinks({
  country,
  missing,
}: {
  country: string;
  missing?: string;
}) {
  const query = missing ? { missing } : undefined;

  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs">
      <Link
        className="font-semibold text-[#4f7f1f] hover:underline"
        href={countryQueryHref("/postgres-preview/analysis", country)}
      >
        Analysis
      </Link>
      <Link
        className="font-semibold text-[#4f7f1f] hover:underline"
        href={countryQueryHref("/postgres-preview/map", country)}
      >
        Map
      </Link>
      <Link
        className="font-semibold text-[#4f7f1f] hover:underline"
        href={countryWorklistHref("/postgres-preview/projects", country, query)}
      >
        Projects
      </Link>
      <Link
        className="font-semibold text-[#4f7f1f] hover:underline"
        href={countryWorklistHref(
          "/postgres-preview/operating-assets",
          country,
          query
        )}
      >
        Plants
      </Link>
      <Link
        className="font-semibold text-[#4f7f1f] hover:underline"
        href={countryWorklistHref("/postgres-preview/companies", country, query)}
      >
        Companies
      </Link>
    </div>
  );
}

function sortCountriesByMetric(
  countries: PostgresCountryMarketSummary[],
  metric: (country: PostgresCountryMarketSummary) => number
) {
  return [...countries]
    .filter((country) => metric(country) > 0)
    .sort((left, right) => metric(right) - metric(left))
    .slice(0, 5);
}

function sortCountriesByUpdate(countries: PostgresCountryMarketSummary[]) {
  return [...countries]
    .filter(
      (country) =>
        country.latest_update_at && !country.latest_update_at.startsWith("1970")
    )
    .sort(
      (left, right) =>
        new Date(right.latest_update_at).getTime() -
        new Date(left.latest_update_at).getTime()
    )
    .slice(0, 5);
}

function aggregateRegions(
  countries: PostgresCountryMarketSummary[],
  kind: RegionSummary["kind"]
) {
  const key = kind === "tge" ? "tge_region" : "wb_region";
  const summaries = new Map<string, RegionSummary>();

  for (const country of countries) {
    const name = country[key] || "Unclassified";
    const summary =
      summaries.get(name) ||
      {
        name,
        kind,
        countryCount: 0,
        recordCount: 0,
        operatingMwe: 0,
        pipelineMwe: 0,
        sourceGaps: 0,
      };

    summary.countryCount += 1;
    summary.recordCount +=
      country.project_count +
      country.operating_asset_count +
      country.company_count;
    summary.operatingMwe += country.operating_installed_mwe;
    summary.pipelineMwe += country.project_pipeline_mwe;
    summary.sourceGaps += country.missing_source_count;
    summaries.set(name, summary);
  }

  return [...summaries.values()].sort(
    (left, right) =>
      right.operatingMwe +
        right.pipelineMwe -
        (left.operatingMwe + left.pipelineMwe) ||
      right.recordCount - left.recordCount ||
      left.name.localeCompare(right.name)
  );
}

function RegionCard({ region }: { region: RegionSummary }) {
  const sourceGapToneClass = postgresStatusToneClass(
    region.sourceGaps > 0 ? "attention" : "success"
  );

  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <Link
        className="block hover:text-[#4f7d20]"
        href={marketRegionHref(region.kind, region.name)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {region.kind === "tge" ? "TGE Region" : "World Bank Region"}
            </div>
            <div className="mt-1 font-bold text-[#1f2937]">{region.name}</div>
            <div className="mt-2 text-xs leading-5 text-gray-500">
              {formatCount(region.countryCount)} markets ·{" "}
              {formatCount(region.recordCount)} market profiles
            </div>
          </div>
          <span
            className={`inline-flex min-h-7 shrink-0 items-center border px-2 text-xs font-semibold ${sourceGapToneClass}`}
          >
            {formatCount(region.sourceGaps)} gaps
          </span>
        </div>
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="border border-gray-200 bg-[#f7f7f7] px-2 py-2">
          <div className="font-semibold text-[#1f2937]">
            {formatMw(region.operatingMwe)} MWe
          </div>
          <div className="mt-1 text-gray-500">operating</div>
        </div>
        <div className="border border-gray-200 bg-[#f7f7f7] px-2 py-2">
          <div className="font-semibold text-[#1f2937]">
            {formatMw(region.pipelineMwe)} MWe
          </div>
          <div className="mt-1 text-gray-500">pipeline</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
        <Link
          className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
          href={regionWorklistHref(
            "/postgres-preview/analysis",
            region.kind,
            region.name
          )}
        >
          Analysis
        </Link>
        <Link
          className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
          href={regionWorklistHref(
            "/postgres-preview/map",
            region.kind,
            region.name
          )}
        >
          Map
        </Link>
        <Link
          className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
          href={regionWorklistHref(
            "/postgres-preview/projects",
            region.kind,
            region.name
          )}
        >
          Projects
        </Link>
        <Link
          className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
          href={regionWorklistHref(
            "/postgres-preview/operating-assets",
            region.kind,
            region.name
          )}
        >
          Plants
        </Link>
        <Link
          className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
          href={regionWorklistHref(
            "/postgres-preview/companies",
            region.kind,
            region.name
          )}
        >
          Companies
        </Link>
      </div>
    </div>
  );
}

function RegionCapacityBars({
  region,
  maxCapacity,
}: {
  region: RegionSummary;
  maxCapacity: number;
}) {
  const operatingShare =
    maxCapacity > 0 ? Math.round((region.operatingMwe / maxCapacity) * 100) : 0;
  const pipelineShare =
    maxCapacity > 0 ? Math.round((region.pipelineMwe / maxCapacity) * 100) : 0;

  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
          <span>Operating</span>
          <span className="font-semibold text-[#1f2937]">
            {formatMw(region.operatingMwe)} MWe
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden bg-gray-100">
          <div
            className={`h-full ${postgresStatusBarClass("operating")}`}
            style={{
              width:
                operatingShare > 0 ? `${Math.max(2, operatingShare)}%` : "0%",
            }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
          <span>Pipeline</span>
          <span className="font-semibold text-[#1f2937]">
            {formatMw(region.pipelineMwe)} MWe
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden bg-gray-100">
          <div
            className={`h-full ${postgresStatusBarClass("info")}`}
            style={{
              width:
                pipelineShare > 0 ? `${Math.max(2, pipelineShare)}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TgeRegionOverview({ regions }: { regions: RegionSummary[] }) {
  const maxCapacity = Math.max(
    1,
    ...regions.map((region) => region.operatingMwe + region.pipelineMwe)
  );

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1f2937]">
            TGE Regional Intelligence Overview
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Primary market-intelligence regions for geothermal reporting,
            benchmarking, and future regional profile pages.
          </p>
        </div>
        <span className="inline-flex min-h-7 items-center self-start border border-[#b9d98b] bg-[#f1f8e8] px-2 text-xs font-semibold uppercase tracking-wide text-[#3f6f19] sm:self-auto">
          Primary taxonomy
        </span>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {regions.map((region) => (
          <article key={region.name} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  className="font-semibold text-[#1f2937] hover:text-[#4f7d20] hover:underline"
                  href={marketRegionHref(region.kind, region.name)}
                >
                  {region.name}
                </Link>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  {formatCount(region.countryCount)} markets ·{" "}
                  {formatCount(region.recordCount)} market profiles
                </div>
              </div>
              <span
                className={`inline-flex min-h-7 shrink-0 items-center border px-2 text-xs font-semibold ${postgresStatusToneClass(
                  region.sourceGaps > 0 ? "attention" : "success"
                )}`}
              >
                {formatCount(region.sourceGaps)} gaps
              </span>
            </div>
            <div className="mt-4">
              <RegionCapacityBars region={region} maxCapacity={maxCapacity} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <Link
                className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
                href={regionWorklistHref(
                  "/postgres-preview/analysis",
                  region.kind,
                  region.name
                )}
              >
                Analysis
              </Link>
              <Link
                className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
                href={regionWorklistHref(
                  "/postgres-preview/projects",
                  region.kind,
                  region.name
                )}
              >
                Projects
              </Link>
              <Link
                className="border border-gray-200 px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7d20]"
                href={regionWorklistHref(
                  "/postgres-preview/operating-assets",
                  region.kind,
                  region.name
                )}
              >
                Plants
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[900px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[24%] px-5 py-3 font-semibold">Region</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Coverage</th>
              <th className="w-[34%] px-5 py-3 font-semibold">
                Capacity Signal
              </th>
              <th className="w-[12%] px-5 py-3 font-semibold">Source Gaps</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {regions.map((region) => (
              <tr
                key={region.name}
                className="align-top transition-colors hover:bg-[#fbfdf8]"
              >
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7d20] hover:underline"
                    href={marketRegionHref(region.kind, region.name)}
                  >
                    {region.name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    TGE regional market view
                  </div>
                </td>
                <td className="px-5 py-4 text-xs leading-5 text-gray-600">
                  {formatCount(region.countryCount)} markets
                  <br />
                  {formatCount(region.recordCount)} staged profiles
                </td>
                <td className="px-5 py-4">
                  <RegionCapacityBars
                    region={region}
                    maxCapacity={maxCapacity}
                  />
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex min-h-7 items-center border px-2 text-xs font-semibold ${postgresStatusToneClass(
                      region.sourceGaps > 0 ? "attention" : "success"
                    )}`}
                  >
                    {formatCount(region.sourceGaps)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="grid gap-1 text-xs font-semibold">
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={regionWorklistHref(
                        "/postgres-preview/analysis",
                        region.kind,
                        region.name
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={regionWorklistHref(
                        "/postgres-preview/projects",
                        region.kind,
                        region.name
                      )}
                    >
                      Projects
                    </Link>
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={regionWorklistHref(
                        "/postgres-preview/operating-assets",
                        region.kind,
                        region.name
                      )}
                    >
                      Plants
                    </Link>
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={regionWorklistHref(
                        "/postgres-preview/map",
                        region.kind,
                        region.name
                      )}
                    >
                      Map
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RegionDrilldownLayer({
  allCountries,
}: {
  allCountries: PostgresCountryMarketSummary[];
}) {
  const tgeRegions = aggregateRegions(allCountries, "tge");
  const wbRegions = aggregateRegions(allCountries, "wb");

  return (
    <div className="space-y-4">
      <TgeRegionOverview regions={tgeRegions} />

      <details className="border border-gray-200 bg-white">
        <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 marker:hidden sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1f2937]">
              World Bank Region Reference
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Secondary taxonomy for donor reporting and external benchmarking.
              TGE regions remain the primary market-intelligence view.
            </p>
          </div>
          <span className="inline-flex min-h-7 shrink-0 items-center self-start border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Secondary taxonomy
          </span>
        </summary>
        <div className="grid gap-3 border-t border-gray-200 p-4 md:grid-cols-2 xl:grid-cols-3">
          {wbRegions.map((region) => (
            <RegionCard key={region.name} region={region} />
          ))}
        </div>
      </details>
    </div>
  );
}

function CountryQueueCard({
  title,
  description,
  countries,
  metric,
  missing,
  emptyLabel,
  defaultOpen = true,
}: {
  title: string;
  description: string;
  countries: PostgresCountryMarketSummary[];
  metric: (country: PostgresCountryMarketSummary) => {
    value: string;
    note: string;
  };
  missing?: string;
  emptyLabel: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className="border border-gray-200 bg-white" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 border-b border-gray-200 px-4 py-3 marker:hidden sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1f2937]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
        <span className="inline-flex min-h-7 shrink-0 items-center self-start border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
          {formatCount(countries.length)} markets
        </span>
      </summary>
      <div className="divide-y divide-gray-100">
        {countries.length > 0 ? (
          countries.map((country) => {
            const item = metric(country);

            return (
              <div key={country.country} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#1f2937]">
                      {country.country}
                    </div>
                    <CountryReferenceMeta country={country} />
                    <div className="mt-1 text-xs text-gray-500">
                      {item.note}
                    </div>
                  </div>
                  <span className="inline-flex min-h-7 shrink-0 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
                    {item.value}
                  </span>
                </div>
                <CountryWorklistLinks country={country.country} missing={missing} />
              </div>
            );
          })
        ) : (
          <div className="px-4 py-6 text-sm text-gray-500">{emptyLabel}</div>
        )}
      </div>
    </details>
  );
}

function CountryOperationsLayer({
  countries,
}: {
  countries: PostgresCountryMarketSummary[];
}) {
  const sourceGapMarkets = sortCountriesByMetric(
    countries,
    (country) => country.missing_source_count
  );
  const pipelineMarkets = sortCountriesByMetric(
    countries,
    (country) => country.project_pipeline_mwe
  );
  const operatingMarkets = sortCountriesByMetric(
    countries,
    (country) => country.operating_installed_mwe
  );
  const directUseMarkets = sortCountriesByMetric(
    countries,
    (country) =>
      country.direct_use_project_count + country.direct_use_asset_count
  );
  const recentMarkets = sortCountriesByUpdate(countries);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <CountryQueueCard
        title="Source Gap Markets"
        description="Market-scoped projects, plants, and companies that need evidence before export-ready use."
        countries={sourceGapMarkets}
        defaultOpen={false}
        missing="source"
        emptyLabel="No market-level source gaps in the current summary."
        metric={(country) => ({
          value: formatCount(country.missing_source_count),
          note: "profiles without confirmed evidence links",
        })}
      />
      <CountryQueueCard
        title="Pipeline Markets"
        description="Pipeline markets queued for source and analysis review."
        countries={pipelineMarkets}
        defaultOpen={false}
        emptyLabel="No pipeline capacity values in the current market summary."
        metric={(country) => ({
          value: `${formatMw(country.project_pipeline_mwe)} MWe`,
          note: `${formatCount(country.active_project_count)} active projects`,
        })}
      />
      <CountryQueueCard
        title="Operating Markets"
        description="Operating markets queued for source and capacity review."
        countries={operatingMarkets}
        defaultOpen={false}
        emptyLabel="No operating electric capacity values in the current market summary."
        metric={(country) => ({
          value: `${formatMw(country.operating_installed_mwe)} MWe`,
          note: `${formatCount(country.operating_asset_active_count)} active plants`,
        })}
      />
      <CountryQueueCard
        title="Direct-Use Markets"
        description="Markets with direct-use projects or plants visible in staging."
        countries={directUseMarkets}
        defaultOpen={false}
        emptyLabel="No direct-use market activity in the current summary."
        metric={(country) => ({
          value: formatCount(
            country.direct_use_project_count + country.direct_use_asset_count
          ),
          note: `${formatMw(
            country.project_thermal_mwth + country.operating_thermal_mwth
          )} MWth staged`,
        })}
      />
      <CountryQueueCard
        title="Recently Updated Markets"
        description="Market profiles likely to show recent staging or evidence activity."
        countries={recentMarkets}
        defaultOpen={false}
        emptyLabel="No recent market update metadata available."
        metric={(country) => ({
          value: formatDate(country.latest_update_at),
          note: `${formatCount(
            country.project_count +
              country.operating_asset_count +
              country.company_count
          )} staged profiles`,
        })}
      />
    </div>
  );
}

function MarketSignalBar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "operating" | "pipeline" | "attention";
}) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const barClass =
    tone === "operating"
      ? postgresStatusBarClass("operating")
      : tone === "pipeline"
        ? postgresStatusBarClass("info")
        : postgresStatusBarClass("attention");

  return (
    <div className="mt-2 h-1.5 overflow-hidden bg-gray-100">
      <div
        className={`h-full ${barClass}`}
        style={{ width: width > 0 ? `${width}%` : "0%" }}
      />
    </div>
  );
}

function MarketRankingsLayer({
  countries,
}: {
  countries: PostgresCountryMarketSummary[];
}) {
  const rankedMarkets = [...countries]
    .sort(
      (left, right) =>
        right.operating_installed_mwe +
          right.project_pipeline_mwe -
          (left.operating_installed_mwe + left.project_pipeline_mwe) ||
        right.active_project_count - left.active_project_count ||
        left.country.localeCompare(right.country)
    )
    .slice(0, 12);
  const maxOperating = Math.max(
    1,
    ...rankedMarkets.map((country) => country.operating_installed_mwe)
  );
  const maxPipeline = Math.max(
    1,
    ...rankedMarkets.map((country) => country.project_pipeline_mwe)
  );
  const maxSourceGaps = Math.max(
    1,
    ...rankedMarkets.map((country) => country.missing_source_count)
  );

  return (
    <details className="border border-gray-200 bg-white" open>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Market Rankings
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Top markets by combined operating and pipeline capacity, with source
            gaps kept visible as governance context.
          </p>
        </div>
        <span className="inline-flex min-h-8 w-fit items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
          {formatCount(rankedMarkets.length)} markets
        </span>
      </summary>

      <div className="divide-y divide-gray-100 border-t border-gray-200 lg:hidden">
        {rankedMarkets.map((country, index) => (
          <article key={country.country} className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  #{index + 1}
                </div>
                <div className="mt-1 font-semibold text-[#1f2937]">
                  {country.country}
                </div>
                <CountryReferenceMeta country={country} />
              </div>
              <Link
                className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                href={countryQueryHref(
                  "/postgres-preview/analysis",
                  country.country
                )}
              >
                Analysis
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MobileMarketField label="Operating">
                <div className="font-semibold text-[#1f2937]">
                  {formatMw(country.operating_installed_mwe)} MWe
                </div>
                <MarketSignalBar
                  max={maxOperating}
                  tone="operating"
                  value={country.operating_installed_mwe}
                />
              </MobileMarketField>
              <MobileMarketField label="Pipeline">
                <div className="font-semibold text-[#1f2937]">
                  {formatMw(country.project_pipeline_mwe)} MWe
                </div>
                <MarketSignalBar
                  max={maxPipeline}
                  tone="pipeline"
                  value={country.project_pipeline_mwe}
                />
              </MobileMarketField>
              <MobileMarketField label="Activity">
                {formatCount(country.active_project_count)} active projects
                <br />
                {formatCount(country.operating_asset_active_count)} active plants
              </MobileMarketField>
              <MobileMarketField label="Source Gaps">
                <div className="font-semibold text-[#1f2937]">
                  {formatCount(country.missing_source_count)}
                </div>
                <MarketSignalBar
                  max={maxSourceGaps}
                  tone="attention"
                  value={country.missing_source_count}
                />
              </MobileMarketField>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto border-t border-gray-200 lg:block">
        <table className="min-w-[960px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] tracking-wide text-gray-500">
            <tr>
              <th className="w-[20%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[21%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[21%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Activity</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Source Gaps</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rankedMarkets.map((country, index) => (
              <tr
                key={country.country}
                className="align-top transition-colors hover:bg-[#fbfdf8]"
              >
                <td className="px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    #{index + 1}
                  </div>
                  <div className="mt-1 font-semibold text-[#1f2937]">
                    {country.country}
                  </div>
                  <CountryReferenceMeta country={country} />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div className="font-semibold text-[#1f2937]">
                    {formatMw(country.operating_installed_mwe)} MWe
                  </div>
                  <MarketSignalBar
                    max={maxOperating}
                    tone="operating"
                    value={country.operating_installed_mwe}
                  />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div className="font-semibold text-[#1f2937]">
                    {formatMw(country.project_pipeline_mwe)} MWe
                  </div>
                  <MarketSignalBar
                    max={maxPipeline}
                    tone="pipeline"
                    value={country.project_pipeline_mwe}
                  />
                </td>
                <td className="px-5 py-4 text-xs leading-5 text-gray-600">
                  {formatCount(country.active_project_count)} active projects
                  <br />
                  {formatCount(country.operating_asset_active_count)} active plants
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex h-7 items-center border px-2 text-xs font-semibold ${
                      country.missing_source_count > 0
                        ? postgresStatusToneClass("attention")
                        : postgresStatusToneClass("success")
                    }`}
                  >
                    {formatCount(country.missing_source_count)}
                  </span>
                  <MarketSignalBar
                    max={maxSourceGaps}
                    tone="attention"
                    value={country.missing_source_count}
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="grid gap-1 text-xs font-semibold">
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/analysis",
                        country.country
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/map",
                        country.country
                      )}
                    >
                      Map
                    </Link>
                    <Link
                      className="text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/projects",
                        country.country
                      )}
                    >
                      Projects
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function CountryMarketsTable({
  countries,
}: {
  countries: PostgresCountryMarketSummary[];
}) {
  const sourceGapCount = countries.reduce(
    (sum, country) => sum + country.missing_source_count,
    0
  );

  return (
    <details className="border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Full Market Worklist
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Detailed market rows. Click counts to open filtered
            project, plant, or company worklists.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {formatCount(countries.length)} markets
          </span>
          <span
            className={`inline-flex min-h-8 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-wide ${
              sourceGapCount > 0
                ? postgresStatusToneClass("attention")
                : postgresStatusToneClass("success")
            }`}
          >
            {formatCount(sourceGapCount)} source gaps
          </span>
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Expand
          </span>
        </div>
      </summary>

      <div className="divide-y divide-gray-100 border-t border-gray-200 lg:hidden">
        {countries.map((country) => (
          <article key={country.country} className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-semibold text-[#1f2937]">
                  {country.country}
                </div>
                <CountryReferenceMeta country={country} />
                <div className="mt-1 text-xs text-gray-500">
                  {formatCount(
                    country.project_count +
                      country.operating_asset_count +
                      country.company_count
                  )}{" "}
                  staged profiles
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated {formatDate(country.latest_update_at)}
                </div>
              </div>
              <span
                className={`inline-flex h-7 w-fit items-center border px-2 text-xs font-semibold ${
                  country.missing_source_count > 0
                    ? postgresStatusToneClass("attention")
                    : postgresStatusToneClass("success")
                }`}
              >
                {formatCount(country.missing_source_count)} source gaps
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MobileMarketField label="Profiles">
                <div className="grid gap-1 text-xs">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/projects",
                      country.country
                    )}
                  >
                    {formatCount(country.project_count)} projects
                  </Link>
                  <span className="text-gray-500">
                    {formatCount(country.active_project_count)} active
                  </span>
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/operating-assets",
                      country.country
                    )}
                  >
                    {formatCount(country.operating_asset_count)} plants
                  </Link>
                  <span className="text-gray-500">
                    {formatCount(country.operating_asset_active_count)} active
                  </span>
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/companies",
                      country.country
                    )}
                  >
                    {formatCount(country.company_count)} companies
                  </Link>
                </div>
              </MobileMarketField>
              <MobileMarketField label="Electric">
                <div className="font-semibold text-[#1f2937]">
                  {formatMw(country.operating_installed_mwe)} MWe operating
                </div>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  {formatMw(country.operating_running_mwe)} MWe running
                  <br />
                  {formatMw(country.project_pipeline_mwe)} MWe pipeline
                </div>
              </MobileMarketField>
              <MobileMarketField label="Direct Use / Thermal">
                <div className="font-semibold text-[#1f2937]">
                  {formatCount(
                    country.direct_use_project_count +
                      country.direct_use_asset_count
                  )}{" "}
                  direct-use profiles
                </div>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  {formatMw(
                    country.project_thermal_mwth +
                      country.operating_thermal_mwth
                  )}{" "}
                  MWth
                </div>
              </MobileMarketField>
              <MobileMarketField label="Review Coverage">
                <CoverageBar
                  approved={country.approved_record_count}
                  draft={country.draft_record_count}
                />
              </MobileMarketField>
              <MobileMarketField label="Open">
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/analysis",
                      country.country
                    )}
                  >
                    Analysis
                  </Link>
                  <Link
                    className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/map",
                      country.country
                    )}
                  >
                    Map
                  </Link>
                  <Link
                    className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/projects",
                      country.country
                    )}
                  >
                    Projects
                  </Link>
                  <Link
                    className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/operating-assets",
                      country.country
                    )}
                  >
                    Plants
                  </Link>
                  <Link
                    className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/companies",
                      country.country
                    )}
                  >
                    Companies
                  </Link>
                </div>
              </MobileMarketField>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto border-t border-gray-200 lg:block">
        <table className="min-w-[980px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[20%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Profiles</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Electric</th>
              <th className="w-[14%] px-5 py-3 font-semibold">
                Direct Use / Thermal
              </th>
              <th className="w-[16%] px-5 py-3 font-semibold">
                Review Coverage
              </th>
              <th className="w-[10%] px-5 py-3 font-semibold">
                Source Gaps
              </th>
              <th className="w-[14%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {countries.map((country) => (
              <tr key={country.country} className="align-top">
                <td className="px-5 py-4">
                  <div className="font-semibold text-[#1f2937]">
                    {country.country}
                  </div>
                  <CountryReferenceMeta country={country} />
                  <div className="mt-1 text-xs text-gray-500">
                    {formatCount(
                      country.project_count +
                        country.operating_asset_count +
                        country.company_count
                    )}{" "}
                    staged profiles
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Updated {formatDate(country.latest_update_at)}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div className="grid gap-2 text-xs">
                    <Link
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/projects",
                        country.country
                      )}
                    >
                      {formatCount(country.project_count)} projects
                    </Link>
                    <span className="text-gray-500">
                      {formatCount(country.active_project_count)} active
                    </span>
                    <Link
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/operating-assets",
                        country.country
                      )}
                    >
                      {formatCount(country.operating_asset_count)} plants
                    </Link>
                    <span className="text-gray-500">
                      {formatCount(country.operating_asset_active_count)} active
                    </span>
                    <Link
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/companies",
                        country.country
                      )}
                    >
                      {formatCount(country.company_count)} companies
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div className="font-semibold text-[#1f2937]">
                    {formatMw(country.operating_installed_mwe)} MWe operating
                  </div>
                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    {formatMw(country.operating_running_mwe)} MWe running
                    <br />
                    {formatMw(country.project_pipeline_mwe)} MWe pipeline
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div className="font-semibold text-[#1f2937]">
                    {formatCount(
                      country.direct_use_project_count +
                        country.direct_use_asset_count
                    )}{" "}
                    direct-use profiles
                  </div>
                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    {formatMw(
                      country.project_thermal_mwth +
                        country.operating_thermal_mwth
                    )}{" "}
                    MWth
                  </div>
                </td>
                <td className="px-5 py-4">
                  <CoverageBar
                    approved={country.approved_record_count}
                    draft={country.draft_record_count}
                  />
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex h-7 items-center border px-2 text-xs font-semibold ${
                      country.missing_source_count > 0
                        ? postgresStatusToneClass("attention")
                        : postgresStatusToneClass("success")
                    }`}
                  >
                    {formatCount(country.missing_source_count)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="grid gap-1">
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/analysis",
                        country.country
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/map",
                        country.country
                      )}
                    >
                      Map
                    </Link>
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/projects",
                        country.country
                      )}
                    >
                      Projects
                    </Link>
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/operating-assets",
                        country.country
                      )}
                    >
                      Plants
                    </Link>
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                      href={countryQueryHref(
                        "/postgres-preview/companies",
                        country.country
                      )}
                    >
                      Companies
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function PostgresCountryMarketsPage({
  searchParams,
}: {
  searchParams?: Promise<CountryMarketSearchParams>;
}) {
  const data = await getCountriesData();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeMarket = cleanParam(resolvedSearchParams.country);
  const activeTgeRegion = cleanParam(resolvedSearchParams.tge_region);
  const activeWbRegion = cleanParam(resolvedSearchParams.wb_region);
  const allCountries = data.ok ? data.countries : [];
  const countries = allCountries.filter((country) => {
    if (activeMarket && country.country !== activeMarket) {
      return false;
    }

    if (activeTgeRegion && country.tge_region !== activeTgeRegion) {
      return false;
    }

    if (activeWbRegion && country.wb_region !== activeWbRegion) {
      return false;
    }

    return true;
  });
  const activeFilterLabel = activeMarket
    ? `Market: ${activeMarket}`
    : activeTgeRegion
      ? `TGE region: ${activeTgeRegion}`
      : activeWbRegion
        ? `World Bank region: ${activeWbRegion}`
        : "";
  const totals = countries.reduce(
    (acc, country) => ({
      operatingMwe: acc.operatingMwe + country.operating_installed_mwe,
      pipelineMwe: acc.pipelineMwe + country.project_pipeline_mwe,
      directUseRecords:
        acc.directUseRecords +
        country.direct_use_project_count +
        country.direct_use_asset_count,
      sourceGaps: acc.sourceGaps + country.missing_source_count,
    }),
    {
      operatingMwe: 0,
      pipelineMwe: 0,
      directUseRecords: 0,
      sourceGaps: 0,
    }
  );

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                Markets
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                PostgreSQL-backed market intelligence layer for regional and
                country-market drilldowns, filtered worklists, and
                replacement-readiness checks. TGE regions are the primary market
                framework; World Bank regions remain available as a secondary
                reporting taxonomy.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Link
                className="inline-flex h-10 w-full items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] sm:w-auto"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 w-full items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] sm:w-auto"
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the main market workflows: regional intelligence, rankings, and benchmark analysis."
        actions={[
          {
            label: "TGE Regions",
            title: "Open regional intelligence",
            description: "Compare markets through the primary TGE region taxonomy.",
            href: "#region-drilldown",
          },
          {
            label: "Rankings",
            title: "Compare top markets",
            description: "Review operating capacity, pipeline capacity, activity, and source gaps side by side.",
            href: "#market-rankings",
          },
          {
            label: "Analysis",
            title: "Compare market signals",
            description: "Move into lifecycle, operating status, and market comparison views.",
            href: "/postgres-preview/analysis#market-drilldown",
          },
        ]}
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              {
                href: "#market-snapshot",
                label: "Snapshot",
                note: "KPIs",
              },
              {
                href: "#region-drilldown",
                label: "Regions",
                note: "TGE first",
              },
              {
                href: "#market-rankings",
                label: "Rankings",
                note: "Markets",
              },
              {
                href: "#market-operations",
                label: "Review",
                note: "Queues",
              },
              {
                href: "#market-worklist",
                label: "Worklist",
                note: "Table",
              },
            ]}
          />

          <section id="market-snapshot" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Market Snapshot"
              description="Coverage, capacity, direct use, source gaps."
              tone="core"
            />

            {activeFilterLabel ? (
              <div className="flex flex-col gap-3 border border-[#b9d98b] bg-[#f7fbf1] px-4 py-3 text-sm text-[#365f16] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold">Active market filter:</span>{" "}
                  {activeFilterLabel}
                </div>
                <Link
                  className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f] hover:underline"
                  href="/postgres-preview/markets#market-rankings"
                >
                  Clear Market Filter
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatTile
                label="Markets"
                note="Country markets with staged activity"
                value={formatCount(countries.length)}
              />
              <StatTile
                label="Operating"
                note="Installed electric capacity in staged plants"
                value={`${formatMw(totals.operatingMwe)} MWe`}
              />
              <StatTile
                label="Pipeline"
                note="Project electric capacity in staged pipeline"
                value={`${formatMw(totals.pipelineMwe)} MWe`}
              />
              <StatTile
                label="Direct Use"
                note="Direct-use project and plant profiles"
                value={formatCount(totals.directUseRecords)}
              />
              <StatTile
                label="Source Gaps"
                note="Profiles without confirmed evidence links"
                value={formatCount(totals.sourceGaps)}
              />
            </div>
          </section>

          <section id="region-drilldown" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Intelligence"
              title="Regional Market Intelligence"
              description="TGE regions drive the primary market view; World Bank regions remain available as a secondary taxonomy."
              tone="workflow"
            />

            <RegionDrilldownLayer allCountries={allCountries} />
          </section>

          <section id="market-rankings" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Intelligence"
              title="Market Rankings"
              description="Market-level comparison of operating capacity, pipeline capacity, activity, and evidence gaps."
              tone="core"
            />

            <MarketRankingsLayer countries={countries} />
          </section>

          <section id="market-operations" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Market Review Queues"
              description="Operational review queues for source gaps, market priority, direct-use coverage, and recent activity."
              tone="governance"
            />

            <CountryOperationsLayer countries={countries} />
          </section>

          <section id="market-worklist" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workbench"
              title="Market Worklist"
              description="Comparison, validation coverage, drill-through."
              tone="workflow"
            />

            <CountryMarketsTable countries={countries} />
          </section>
        </>
      )}
    </main>
  );
}
