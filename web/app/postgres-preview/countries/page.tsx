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

  return `/postgres-preview/countries?${params.toString()}#market-operations`;
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
              {formatCount(region.countryCount)} countries ·{" "}
              {formatCount(region.recordCount)} records
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

function RegionDrilldownLayer({
  allCountries,
}: {
  allCountries: PostgresCountryMarketSummary[];
}) {
  const tgeRegions = aggregateRegions(allCountries, "tge");
  const wbRegions = aggregateRegions(allCountries, "wb");

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold text-[#1f2937]">TGE Regions</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Editorial and market-intelligence regional grouping.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {tgeRegions.map((region) => (
            <RegionCard key={region.name} region={region} />
          ))}
        </div>
      </section>
      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold text-[#1f2937]">
            World Bank Regions
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            External reporting and donor-aligned regional grouping.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {wbRegions.map((region) => (
            <RegionCard key={region.name} region={region} />
          ))}
        </div>
      </section>
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
        description="Country-scoped records that need evidence before export-ready use."
        countries={sourceGapMarkets}
        missing="source"
        emptyLabel="No country-level source gaps in the current summary."
        metric={(country) => ({
          value: formatCount(country.missing_source_count),
          note: "records without confirmed evidence links",
        })}
      />
      <CountryQueueCard
        title="Pipeline Markets"
        description="Largest project pipeline markets for market-page and analysis review."
        countries={pipelineMarkets}
        emptyLabel="No pipeline capacity values in the current country summary."
        metric={(country) => ({
          value: `${formatMw(country.project_pipeline_mwe)} MWe`,
          note: `${formatCount(country.active_project_count)} active project records`,
        })}
      />
      <CountryQueueCard
        title="Operating Markets"
        description="Largest operating markets by staged installed electric capacity."
        countries={operatingMarkets}
        emptyLabel="No operating electric capacity values in the current country summary."
        metric={(country) => ({
          value: `${formatMw(country.operating_installed_mwe)} MWe`,
          note: `${formatCount(country.operating_asset_active_count)} active plant records`,
        })}
      />
      <CountryQueueCard
        title="Direct-Use Markets"
        description="Markets with direct-use projects or plants visible in staging."
        countries={directUseMarkets}
        defaultOpen={false}
        emptyLabel="No direct-use country records in the current summary."
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
        description="Country pages likely to show recent staging or evidence activity."
        countries={recentMarkets}
        defaultOpen={false}
        emptyLabel="No recent country update metadata available."
        metric={(country) => ({
          value: formatDate(country.latest_update_at),
          note: `${formatCount(
            country.project_count +
              country.operating_asset_count +
              country.company_count
          )} staged records`,
        })}
      />
    </div>
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
            Country / Market Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Database-derived market rows. Click counts to open filtered
            project, plant, or company worklists.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {formatCount(countries.length)} countries
          </span>
          <span
            className={`inline-flex min-h-8 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-wide ${
              sourceGapCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]"
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
                  staged records
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated {formatDate(country.latest_update_at)}
                </div>
              </div>
              <span
                className={`inline-flex h-7 w-fit items-center border px-2 text-xs font-semibold ${
                  country.missing_source_count > 0
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {formatCount(country.missing_source_count)} source gaps
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MobileMarketField label="Records">
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
                  records
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
              <th className="w-[20%] px-5 py-3 font-semibold">Country</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Records</th>
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
                    staged records
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
                    records
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
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
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
  const activeTgeRegion = cleanParam(resolvedSearchParams.tge_region);
  const activeWbRegion = cleanParam(resolvedSearchParams.wb_region);
  const allCountries = data.ok ? data.countries : [];
  const countries = allCountries.filter((country) => {
    if (activeTgeRegion && country.tge_region !== activeTgeRegion) {
      return false;
    }

    if (activeWbRegion && country.wb_region !== activeWbRegion) {
      return false;
    }

    return true;
  });
  const activeRegionLabel =
    activeTgeRegion || activeWbRegion
      ? activeTgeRegion || activeWbRegion
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
                Countries / Markets
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                First PostgreSQL-backed country layer for market summaries,
                filtered queue entry points, and replacement-readiness checks.
                Detailed editorial market pages will evolve from this base.
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
        description="Use these routes for the three main market workflows: country worklists, source-gap cleanup, and benchmark analysis."
        actions={[
          {
            label: "Regions",
            title: "Open regional drilldowns",
            description: "Filter markets by TGE or World Bank region.",
            href: "#region-drilldown",
          },
          {
            label: "Source Gaps",
            title: "Resolve source-gap markets",
            description: "Review markets where missing evidence weakens export readiness.",
            href: "#market-operations",
          },
          {
            label: "Analysis",
            title: "Compare country signals",
            description: "Move into lifecycle, operating status, and market comparison views.",
            href: "/postgres-preview/analysis#country-drilldown",
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
                note: "TGE / WB",
              },
              {
                href: "#market-operations",
                label: "Operations",
                note: "Queues",
              },
              {
                href: "#country-worklist",
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

            {activeRegionLabel ? (
              <div className="flex flex-col gap-3 border border-[#b9d98b] bg-[#f7fbf1] px-4 py-3 text-sm text-[#365f16] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold">Active region filter:</span>{" "}
                  {activeRegionLabel}
                </div>
                <Link
                  className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f] hover:underline"
                  href="/postgres-preview/countries#region-drilldown"
                >
                  Clear Region Filter
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatTile
                label="Countries"
                note="Canonical countries with staged records"
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
                note="Direct-use project and plant records"
                value={formatCount(totals.directUseRecords)}
              />
              <StatTile
                label="Source Gaps"
                note="Records without confirmed evidence links"
                value={formatCount(totals.sourceGaps)}
              />
            </div>
          </section>

          <section id="region-drilldown" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Intelligence"
              title="Regional Drilldowns"
              description="TGE editorial regions and World Bank regions built from canonical geography."
              tone="workflow"
            />

            <RegionDrilldownLayer allCountries={allCountries} />
          </section>

          <section id="market-operations" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Market Operations"
              description="Country-scoped queues for source gaps, market priority, direct-use coverage, and recent activity."
              tone="workflow"
            />

            <CountryOperationsLayer countries={countries} />
          </section>

          <section id="country-worklist" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workbench"
              title="Country Worklist"
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
