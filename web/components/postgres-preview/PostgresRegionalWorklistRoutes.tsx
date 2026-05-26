import Link from "next/link";
import { formatCount, formatMw } from "@/lib/format";
import type { PostgresCountryMarketSummary } from "@/lib/postgres-preview";

type RegionKind = "tge" | "wb";

type RegionSummary = {
  name: string;
  kind: RegionKind;
  countryCount: number;
  recordCount: number;
  operatingMwe: number;
  pipelineMwe: number;
  sourceGaps: number;
};

function regionParamName(kind: RegionKind) {
  return kind === "tge" ? "tge_region" : "wb_region";
}

function regionHref({
  path,
  kind,
  name,
  hash,
}: {
  path: string;
  kind: RegionKind;
  name: string;
  hash?: string;
}) {
  const params = new URLSearchParams();

  params.set(regionParamName(kind), name);

  return `${path}?${params.toString()}${hash || ""}`;
}

function aggregateRegions(
  countries: PostgresCountryMarketSummary[],
  kind: RegionKind
) {
  const regionKey = kind === "tge" ? "tge_region" : "wb_region";
  const summaries = new Map<string, RegionSummary>();

  for (const country of countries) {
    const name = country[regionKey] || "Unclassified";
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

export default function PostgresRegionalWorklistRoutes({
  countries,
  title = "Regional Worklist Routes",
  description = "Canonical geography routes into regional markets, analysis, map, projects, plants, and companies.",
  kind = "tge",
  limit = 4,
}: {
  countries: PostgresCountryMarketSummary[];
  title?: string;
  description?: string;
  kind?: RegionKind;
  limit?: number;
}) {
  const regions = aggregateRegions(countries, kind).slice(0, limit);

  if (regions.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        {regions.map((region) => (
          <article
            key={`${region.kind}-${region.name}`}
            className="border border-gray-200 bg-[#f7f7f7] px-4 py-4"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {region.kind === "tge" ? "TGE Region" : "World Bank Region"}
            </div>
            <h3 className="mt-2 text-base font-bold text-[#1f2937]">
              {region.name}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="border border-gray-200 bg-white px-2 py-2">
                <div className="font-semibold text-[#1f2937]">
                  {formatMw(region.operatingMwe)} MWe
                </div>
                <div className="mt-1 text-gray-500">operating</div>
              </div>
              <div className="border border-gray-200 bg-white px-2 py-2">
                <div className="font-semibold text-[#1f2937]">
                  {formatMw(region.pipelineMwe)} MWe
                </div>
                <div className="mt-1 text-gray-500">pipeline</div>
              </div>
              <div className="border border-gray-200 bg-white px-2 py-2">
                <div className="font-semibold text-[#1f2937]">
                  {formatCount(region.countryCount)}
                </div>
                <div className="mt-1 text-gray-500">markets</div>
              </div>
              <div className="border border-gray-200 bg-white px-2 py-2">
                <div className="font-semibold text-[#1f2937]">
                  {formatCount(region.sourceGaps)}
                </div>
                <div className="mt-1 text-gray-500">source gaps</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/countries",
                  kind: region.kind,
                  name: region.name,
                  hash: "#market-operations",
                })}
              >
                Markets
              </Link>
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/analysis",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Analysis
              </Link>
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/map",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Map
              </Link>
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/projects",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Projects
              </Link>
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/operating-assets",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Plants
              </Link>
              <Link
                className="border border-gray-200 bg-white px-2 py-1 text-gray-600 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href={regionHref({
                  path: "/postgres-preview/companies",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Companies
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
