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

const regionalRoutesClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  sectionHeader:
    "border-b border-[var(--tge-governance-neutral-border)] px-5 py-4",
  card:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4",
  metric:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-2",
  routeLink:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-1 text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
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
    <section className={regionalRoutesClass.panel}>
      <div className={regionalRoutesClass.sectionHeader}>
        <h2 className={`text-lg font-bold ${regionalRoutesClass.title}`}>{title}</h2>
        <p className={`mt-1 text-sm leading-6 ${regionalRoutesClass.body}`}>{description}</p>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        {regions.map((region) => (
          <article
            key={`${region.kind}-${region.name}`}
            className={regionalRoutesClass.card}
          >
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${regionalRoutesClass.muted}`}>
              {region.kind === "tge" ? "TGE Region" : "World Bank Region"}
            </div>
            <h3 className={`mt-2 text-base font-bold ${regionalRoutesClass.title}`}>
              {region.name}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className={regionalRoutesClass.metric}>
                <div className={`font-semibold ${regionalRoutesClass.title}`}>
                  {formatMw(region.operatingMwe)} MWe
                </div>
                <div className={`mt-1 ${regionalRoutesClass.muted}`}>operating</div>
              </div>
              <div className={regionalRoutesClass.metric}>
                <div className={`font-semibold ${regionalRoutesClass.title}`}>
                  {formatMw(region.pipelineMwe)} MWe
                </div>
                <div className={`mt-1 ${regionalRoutesClass.muted}`}>pipeline</div>
              </div>
              <div className={regionalRoutesClass.metric}>
                <div className={`font-semibold ${regionalRoutesClass.title}`}>
                  {formatCount(region.countryCount)}
                </div>
                <div className={`mt-1 ${regionalRoutesClass.muted}`}>markets</div>
              </div>
              <div className={regionalRoutesClass.metric}>
                <div className={`font-semibold ${regionalRoutesClass.title}`}>
                  {formatCount(region.sourceGaps)}
                </div>
                <div className={`mt-1 ${regionalRoutesClass.muted}`}>source gaps</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <Link
                className={regionalRoutesClass.routeLink}
                href={regionHref({
                  path: "/postgres-preview/markets",
                  kind: region.kind,
                  name: region.name,
                  hash: "#market-operations",
                })}
              >
                Markets
              </Link>
              <Link
                className={regionalRoutesClass.routeLink}
                href={regionHref({
                  path: "/analysis",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Analysis
              </Link>
              <Link
                className={regionalRoutesClass.routeLink}
                href={regionHref({
                  path: "/postgres-preview/map",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Map
              </Link>
              <Link
                className={regionalRoutesClass.routeLink}
                href={regionHref({
                  path: "/postgres-preview/projects",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Projects
              </Link>
              <Link
                className={regionalRoutesClass.routeLink}
                href={regionHref({
                  path: "/postgres-preview/operating-assets",
                  kind: region.kind,
                  name: region.name,
                })}
              >
                Plants
              </Link>
              <Link
                className={regionalRoutesClass.routeLink}
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
