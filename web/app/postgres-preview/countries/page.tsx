import Link from "next/link";
import {
  listPostgresCountryMarketSummaries,
  type PostgresCountryMarketSummary,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { PostgresPreviewSetupNotice } from "@/components/postgres-preview/PostgresPreviewListTables";

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

function countryQueryHref(path: string, country: string) {
  return `${path}?country=${encodeURIComponent(country)}`;
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
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
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
          className="h-full bg-[#8dc63f]"
          style={{ width: `${approvedShare}%` }}
        />
      </div>
    </div>
  );
}

function CountryMarketsTable({
  countries,
}: {
  countries: PostgresCountryMarketSummary[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Country / Market Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Aggregated from PostgreSQL staging projects, plants/facilities, and
            companies. This is the first replacement-ready market layer, not
            the final editorial country profile design.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {formatCount(countries.length)} countries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1180px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[17%] px-5 py-3 font-semibold">Country</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Projects</th>
              <th className="w-[11%] px-5 py-3 font-semibold">
                Plants / Facilities
              </th>
              <th className="w-[9%] px-5 py-3 font-semibold">Companies</th>
              <th className="w-[12%] px-5 py-3 font-semibold">
                Operating MWe
              </th>
              <th className="w-[12%] px-5 py-3 font-semibold">
                Pipeline MWe
              </th>
              <th className="w-[11%] px-5 py-3 font-semibold">Thermal</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Direct Use</th>
              <th className="w-[15%] px-5 py-3 font-semibold">
                Review Coverage
              </th>
              <th className="w-[10%] px-5 py-3 font-semibold">
                Source Gaps
              </th>
              <th className="w-[10%] px-5 py-3 font-semibold">Updated</th>
              <th className="w-[15%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {countries.map((country) => (
              <tr key={country.country} className="align-top">
                <td className="px-5 py-4">
                  <div className="font-semibold text-[#1f2937]">
                    {country.country}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatCount(
                      country.project_count +
                        country.operating_asset_count +
                        country.company_count
                    )}{" "}
                    staged records
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/projects",
                      country.country
                    )}
                  >
                    {formatCount(country.project_count)}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatCount(country.active_project_count)} active
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/operating-assets",
                      country.country
                    )}
                  >
                    {formatCount(country.operating_asset_count)}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatCount(country.operating_asset_active_count)} active
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={countryQueryHref(
                      "/postgres-preview/companies",
                      country.country
                    )}
                  >
                    {formatCount(country.company_count)}
                  </Link>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatMw(country.operating_installed_mwe)} MWe
                  <div className="mt-1 text-xs text-gray-500">
                    {formatMw(country.operating_running_mwe)} running
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatMw(country.project_pipeline_mwe)} MWe
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatMw(
                    country.project_thermal_mwth +
                      country.operating_thermal_mwth
                  )}{" "}
                  MWth
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatCount(
                    country.direct_use_project_count +
                      country.direct_use_asset_count
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    projects + assets
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
                <td className="px-5 py-4 text-gray-700">
                  {formatDate(country.latest_update_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
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
                      Assets
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
    </section>
  );
}

export default async function PostgresCountryMarketsPage() {
  const data = await getCountriesData();

  const countries = data.ok ? data.countries : [];
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
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Countries / Markets
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                First PostgreSQL-backed country layer for market summaries,
                filtered queue entry points, and replacement-readiness checks.
                Detailed editorial market pages will evolve from this base.
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
      </section>

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile
              label="Countries"
              note="With staged project, asset, or company records"
              value={formatCount(countries.length)}
            />
            <StatTile
              label="Operating"
              note="Installed electric capacity in staged assets"
              value={`${formatMw(totals.operatingMwe)} MWe`}
            />
            <StatTile
              label="Pipeline"
              note="Project electric capacity in staged pipeline"
              value={`${formatMw(totals.pipelineMwe)} MWe`}
            />
            <StatTile
              label="Direct Use"
              note="Direct-use project and facility records"
              value={formatCount(totals.directUseRecords)}
            />
            <StatTile
              label="Source Gaps"
              note="Records without confirmed evidence links"
              value={formatCount(totals.sourceGaps)}
            />
          </section>

          <CountryMarketsTable countries={countries} />
        </>
      )}
    </main>
  );
}
