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

const marketClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  neutral: "text-[var(--tge-governance-neutral-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  smallLabel:
    "text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  statTile:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4",
  metaBadge:
    "inline-flex min-h-6 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  link:
    "font-semibold text-[var(--tge-brand-green-dark)] hover:underline",
  tableLink:
    "text-xs font-semibold text-[var(--tge-brand-green-dark)] hover:underline",
  strongLink:
    "font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline",
  compactAction:
    "border border-[var(--tge-governance-neutral-border)] px-2 py-1 text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  action:
    "inline-flex h-10 w-full items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] sm:w-auto",
  details:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  summaryBorder:
    "border-b border-[var(--tge-governance-neutral-border)]",
  dividerBorder: "border-[var(--tge-governance-neutral-border)]",
  mobileDivider:
    "divide-y divide-[var(--tge-governance-muted-border)]",
  tableHead:
    "bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  tableHeadPlain:
    "bg-[var(--tge-governance-neutral-bg)] text-[11px] tracking-wide text-[var(--tge-governance-muted-text)]",
  tableDivider: "divide-y divide-[var(--tge-governance-muted-border)]",
  tableCell: "px-5 py-4 text-[var(--tge-governance-neutral-text)]",
  tableSmallCell:
    "px-5 py-4 text-xs leading-5 text-[var(--tge-governance-neutral-text)]",
  neutralBadge:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  neutralBadgeSolid:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  smallBadge:
    "inline-flex min-h-7 shrink-0 items-center self-start border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  valueBadge:
    "inline-flex min-h-7 shrink-0 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]",
  metricBox:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 py-2",
  track:
    "mt-2 h-1.5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]",
  trackTight:
    "mt-1 h-1.5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]",
  hoverRow:
    "align-top transition-colors hover:bg-[var(--tge-governance-success-bg)]",
  activeFilter:
    "flex flex-col gap-3 border border-[var(--tge-brand-green-light)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm text-[var(--tge-brand-green-dark)] sm:flex-row sm:items-center sm:justify-between",
  primaryTaxonomy:
    "inline-flex min-h-7 items-center self-start border border-[var(--tge-brand-green-light)] bg-[var(--tge-governance-success-bg)] px-2 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)] sm:self-auto",
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
    <div className={marketClass.statTile}>
      <div className={marketClass.label}>
        {label}
      </div>
      <div className={`mt-2 text-xl font-bold leading-none sm:text-2xl ${marketClass.title}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${marketClass.muted}`}>{note}</div>
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
      <div className={`flex items-center justify-between gap-3 text-xs ${marketClass.neutral}`}>
        <span>{approvedShare}% reviewed</span>
        <span>
          {formatCount(approved)} / {formatCount(total)}
        </span>
      </div>
      <div className={marketClass.track}>
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
      <div className={marketClass.smallLabel}>
        {label}
      </div>
      <div className={`mt-1 min-w-0 text-sm ${marketClass.neutral}`}>{children}</div>
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
          className={marketClass.metaBadge}
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
        className={marketClass.link}
        href={countryQueryHref("/postgres-preview/analysis", country)}
      >
        Analysis
      </Link>
      <Link
        className={marketClass.link}
        href={countryQueryHref("/postgres-preview/map", country)}
      >
        Map
      </Link>
      <Link
        className={marketClass.link}
        href={countryWorklistHref("/postgres-preview/projects", country, query)}
      >
        Projects
      </Link>
      <Link
        className={marketClass.link}
        href={countryWorklistHref(
          "/postgres-preview/operating-assets",
          country,
          query
        )}
      >
        Plants
      </Link>
      <Link
        className={marketClass.link}
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
    <div className={`${marketClass.panel} px-4 py-4`}>
      <Link
        className="block hover:text-[var(--tge-brand-green-dark)]"
        href={marketRegionHref(region.kind, region.name)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={marketClass.label}>
              {region.kind === "tge" ? "TGE Region" : "World Bank Region"}
            </div>
            <div className={`mt-1 font-bold ${marketClass.title}`}>{region.name}</div>
            <div className={`mt-2 text-xs leading-5 ${marketClass.muted}`}>
              {formatCount(region.countryCount)} markets ·{" "}
              {formatCount(region.recordCount)} market items
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
        <div className={marketClass.metricBox}>
          <div className={`font-semibold ${marketClass.title}`}>
            {formatMw(region.operatingMwe)} MWe
          </div>
          <div className={`mt-1 ${marketClass.muted}`}>operating</div>
        </div>
        <div className={marketClass.metricBox}>
          <div className={`font-semibold ${marketClass.title}`}>
            {formatMw(region.pipelineMwe)} MWe
          </div>
          <div className={`mt-1 ${marketClass.muted}`}>pipeline</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
        <Link
          className={marketClass.compactAction}
          href={regionWorklistHref(
            "/postgres-preview/analysis",
            region.kind,
            region.name
          )}
        >
          Analysis
        </Link>
        <Link
          className={marketClass.compactAction}
          href={regionWorklistHref(
            "/postgres-preview/map",
            region.kind,
            region.name
          )}
        >
          Map
        </Link>
        <Link
          className={marketClass.compactAction}
          href={regionWorklistHref(
            "/postgres-preview/projects",
            region.kind,
            region.name
          )}
        >
          Projects
        </Link>
        <Link
          className={marketClass.compactAction}
          href={regionWorklistHref(
            "/postgres-preview/operating-assets",
            region.kind,
            region.name
          )}
        >
          Plants
        </Link>
        <Link
          className={marketClass.compactAction}
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
        <div className={`flex items-center justify-between gap-3 text-[11px] ${marketClass.muted}`}>
          <span>Operating</span>
          <span className={`font-semibold ${marketClass.title}`}>
            {formatMw(region.operatingMwe)} MWe
          </span>
        </div>
        <div className={marketClass.trackTight}>
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
        <div className={`flex items-center justify-between gap-3 text-[11px] ${marketClass.muted}`}>
          <span>Pipeline</span>
          <span className={`font-semibold ${marketClass.title}`}>
            {formatMw(region.pipelineMwe)} MWe
          </span>
        </div>
        <div className={marketClass.trackTight}>
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
    <section className={marketClass.panel}>
      <div className={`flex flex-col gap-2 ${marketClass.summaryBorder} px-4 py-3 sm:flex-row sm:items-end sm:justify-between`}>
        <div>
          <h3 className={`text-sm font-bold ${marketClass.title}`}>
            TGE Regional Intelligence Overview
          </h3>
          <p className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
            Primary market-intelligence regions for geothermal reporting,
            benchmarking, and future regional profile pages.
          </p>
        </div>
        <span className={marketClass.primaryTaxonomy}>
          Primary taxonomy
        </span>
      </div>

      <div className={`${marketClass.tableDivider} lg:hidden`}>
        {regions.map((region) => (
          <article key={region.name} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  className={marketClass.strongLink}
                  href={marketRegionHref(region.kind, region.name)}
                >
                  {region.name}
                </Link>
                <div className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
                  {formatCount(region.countryCount)} markets ·{" "}
                  {formatCount(region.recordCount)} market items
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
                className={marketClass.compactAction}
                href={regionWorklistHref(
                  "/postgres-preview/analysis",
                  region.kind,
                  region.name
                )}
              >
                Analysis
              </Link>
              <Link
                className={marketClass.compactAction}
                href={regionWorklistHref(
                  "/postgres-preview/projects",
                  region.kind,
                  region.name
                )}
              >
                Projects
              </Link>
              <Link
                className={marketClass.compactAction}
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
          <thead className={marketClass.tableHead}>
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
          <tbody className={marketClass.tableDivider}>
            {regions.map((region) => (
              <tr
                key={region.name}
                className={marketClass.hoverRow}
              >
                <td className="px-5 py-4">
                  <Link
                    className={marketClass.strongLink}
                    href={marketRegionHref(region.kind, region.name)}
                  >
                    {region.name}
                  </Link>
                  <div className={`mt-1 text-xs ${marketClass.muted}`}>
                    TGE regional market view
                  </div>
                </td>
                <td className={marketClass.tableSmallCell}>
                  {formatCount(region.countryCount)} markets
                  <br />
                  {formatCount(region.recordCount)} market items
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
                      className={marketClass.tableLink}
                      href={regionWorklistHref(
                        "/postgres-preview/analysis",
                        region.kind,
                        region.name
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={regionWorklistHref(
                        "/postgres-preview/projects",
                        region.kind,
                        region.name
                      )}
                    >
                      Projects
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={regionWorklistHref(
                        "/postgres-preview/operating-assets",
                        region.kind,
                        region.name
                      )}
                    >
                      Plants
                    </Link>
                    <Link
                      className={marketClass.tableLink}
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

      <details className={marketClass.details}>
        <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 marker:hidden sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className={`text-sm font-bold ${marketClass.title}`}>
              World Bank Region Reference
            </h3>
            <p className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
              Secondary taxonomy for donor reporting and external benchmarking.
              TGE regions remain the primary market-intelligence view.
            </p>
          </div>
          <span className={marketClass.smallBadge}>
            Secondary taxonomy
          </span>
        </summary>
        <div className={`grid gap-3 border-t ${marketClass.dividerBorder} p-4 md:grid-cols-2 xl:grid-cols-3`}>
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
    <details className={marketClass.details} open={defaultOpen}>
      <summary className={`flex cursor-pointer list-none flex-col gap-2 ${marketClass.summaryBorder} px-4 py-3 marker:hidden sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <h3 className={`text-sm font-bold ${marketClass.title}`}>{title}</h3>
          <p className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
            {description}
          </p>
        </div>
        <span className={marketClass.smallBadge}>
          {formatCount(countries.length)} markets
        </span>
      </summary>
      <div className={marketClass.tableDivider}>
        {countries.length > 0 ? (
          countries.map((country) => {
            const item = metric(country);

            return (
              <div key={country.country} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`font-semibold ${marketClass.title}`}>
                      {country.country}
                    </div>
                    <CountryReferenceMeta country={country} />
                    <div className={`mt-1 text-xs ${marketClass.muted}`}>
                      {item.note}
                    </div>
                  </div>
                  <span className={marketClass.valueBadge}>
                    {item.value}
                  </span>
                </div>
                <CountryWorklistLinks country={country.country} missing={missing} />
              </div>
            );
          })
        ) : (
          <div className={`px-4 py-6 text-sm ${marketClass.muted}`}>{emptyLabel}</div>
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
          note: "items without confirmed evidence links",
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
        description="Markets likely to show recent updates or evidence activity."
        countries={recentMarkets}
        defaultOpen={false}
        emptyLabel="No recent market update metadata available."
        metric={(country) => ({
          value: formatDate(country.latest_update_at),
          note: `${formatCount(
            country.project_count +
              country.operating_asset_count +
              country.company_count
          )} linked items`,
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
    <div className={marketClass.track}>
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
    <details className={marketClass.details} open>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className={`text-lg font-bold ${marketClass.title}`}>
            Market Rankings
          </h2>
          <p className={`mt-1 text-sm leading-6 ${marketClass.body}`}>
            Top markets by combined operating and pipeline capacity, with source
            gaps kept visible as governance context.
          </p>
        </div>
        <span className={`${marketClass.neutralBadge} w-fit`}>
          {formatCount(rankedMarkets.length)} markets
        </span>
      </summary>

      <div className={`${marketClass.mobileDivider} border-t ${marketClass.dividerBorder} lg:hidden`}>
        {rankedMarkets.map((country, index) => (
          <article key={country.country} className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={marketClass.label}>
                  #{index + 1}
                </div>
                <div className={`mt-1 font-semibold ${marketClass.title}`}>
                  {country.country}
                </div>
                <CountryReferenceMeta country={country} />
              </div>
              <Link
                className={marketClass.tableLink}
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
                <div className={`font-semibold ${marketClass.title}`}>
                  {formatMw(country.operating_installed_mwe)} MWe
                </div>
                <MarketSignalBar
                  max={maxOperating}
                  tone="operating"
                  value={country.operating_installed_mwe}
                />
              </MobileMarketField>
              <MobileMarketField label="Pipeline">
                <div className={`font-semibold ${marketClass.title}`}>
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
                <div className={`font-semibold ${marketClass.title}`}>
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

      <div className={`hidden overflow-x-auto border-t ${marketClass.dividerBorder} lg:block`}>
        <table className="min-w-[960px] table-fixed text-left text-sm">
          <thead className={marketClass.tableHeadPlain}>
            <tr>
              <th className="w-[20%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[21%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[21%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Activity</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Source Gaps</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className={marketClass.tableDivider}>
            {rankedMarkets.map((country, index) => (
              <tr
                key={country.country}
                className={marketClass.hoverRow}
              >
                <td className="px-5 py-4">
                  <div className={marketClass.label}>
                    #{index + 1}
                  </div>
                  <div className={`mt-1 font-semibold ${marketClass.title}`}>
                    {country.country}
                  </div>
                  <CountryReferenceMeta country={country} />
                </td>
                <td className={marketClass.tableCell}>
                  <div className={`font-semibold ${marketClass.title}`}>
                    {formatMw(country.operating_installed_mwe)} MWe
                  </div>
                  <MarketSignalBar
                    max={maxOperating}
                    tone="operating"
                    value={country.operating_installed_mwe}
                  />
                </td>
                <td className={marketClass.tableCell}>
                  <div className={`font-semibold ${marketClass.title}`}>
                    {formatMw(country.project_pipeline_mwe)} MWe
                  </div>
                  <MarketSignalBar
                    max={maxPipeline}
                    tone="pipeline"
                    value={country.project_pipeline_mwe}
                  />
                </td>
                <td className={marketClass.tableSmallCell}>
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
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/analysis",
                        country.country
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/map",
                        country.country
                      )}
                    >
                      Map
                    </Link>
                    <Link
                      className={marketClass.tableLink}
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
    <details className={marketClass.details}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className={`text-lg font-bold ${marketClass.title}`}>
            Full Market Worklist
          </h2>
          <p className={`mt-1 text-sm ${marketClass.body}`}>
            Detailed market rows. Click counts to open filtered
            project, plant, or company worklists.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <span className={marketClass.neutralBadge}>
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
          <span className={marketClass.neutralBadgeSolid}>
            Expand
          </span>
        </div>
      </summary>

      <div className={`${marketClass.mobileDivider} border-t ${marketClass.dividerBorder} lg:hidden`}>
        {countries.map((country) => (
          <article key={country.country} className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={`font-semibold ${marketClass.title}`}>
                  {country.country}
                </div>
                <CountryReferenceMeta country={country} />
                <div className={`mt-1 text-xs ${marketClass.muted}`}>
                  {formatCount(
                    country.project_count +
                      country.operating_asset_count +
                      country.company_count
                  )}{" "}
                  linked items
                </div>
                <div className={`mt-1 text-xs ${marketClass.muted}`}>
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
              <MobileMarketField label="Linked Work">
                <div className="grid gap-1 text-xs">
                  <Link
                    className={marketClass.strongLink}
                    href={countryQueryHref(
                      "/postgres-preview/projects",
                      country.country
                    )}
                  >
                    {formatCount(country.project_count)} projects
                  </Link>
                  <span className={marketClass.muted}>
                    {formatCount(country.active_project_count)} active
                  </span>
                  <Link
                    className={marketClass.strongLink}
                    href={countryQueryHref(
                      "/postgres-preview/operating-assets",
                      country.country
                    )}
                  >
                    {formatCount(country.operating_asset_count)} plants
                  </Link>
                  <span className={marketClass.muted}>
                    {formatCount(country.operating_asset_active_count)} active
                  </span>
                  <Link
                    className={marketClass.strongLink}
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
                <div className={`font-semibold ${marketClass.title}`}>
                  {formatMw(country.operating_installed_mwe)} MWe operating
                </div>
                <div className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
                  {formatMw(country.operating_running_mwe)} MWe running
                  <br />
                  {formatMw(country.project_pipeline_mwe)} MWe pipeline
                </div>
              </MobileMarketField>
              <MobileMarketField label="Direct Use / Thermal">
                <div className={`font-semibold ${marketClass.title}`}>
                  {formatCount(
                    country.direct_use_project_count +
                      country.direct_use_asset_count
                  )}{" "}
                  direct-use items
                </div>
                <div className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
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
                    className={marketClass.tableLink}
                    href={countryQueryHref(
                      "/postgres-preview/analysis",
                      country.country
                    )}
                  >
                    Analysis
                  </Link>
                  <Link
                    className={marketClass.tableLink}
                    href={countryQueryHref(
                      "/postgres-preview/map",
                      country.country
                    )}
                  >
                    Map
                  </Link>
                  <Link
                    className={marketClass.tableLink}
                    href={countryQueryHref(
                      "/postgres-preview/projects",
                      country.country
                    )}
                  >
                    Projects
                  </Link>
                  <Link
                    className={marketClass.tableLink}
                    href={countryQueryHref(
                      "/postgres-preview/operating-assets",
                      country.country
                    )}
                  >
                    Plants
                  </Link>
                  <Link
                    className={marketClass.tableLink}
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

      <div className={`hidden overflow-x-auto border-t ${marketClass.dividerBorder} lg:block`}>
        <table className="min-w-[980px] table-fixed text-left text-sm">
          <thead className={marketClass.tableHead}>
            <tr>
              <th className="w-[20%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Linked Work</th>
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
          <tbody className={marketClass.tableDivider}>
            {countries.map((country) => (
              <tr key={country.country} className="align-top">
                <td className="px-5 py-4">
                  <div className={`font-semibold ${marketClass.title}`}>
                    {country.country}
                  </div>
                  <CountryReferenceMeta country={country} />
                  <div className={`mt-1 text-xs ${marketClass.muted}`}>
                    {formatCount(
                      country.project_count +
                        country.operating_asset_count +
                        country.company_count
                    )}{" "}
                    linked items
                  </div>
                  <div className={`mt-1 text-xs ${marketClass.muted}`}>
                    Updated {formatDate(country.latest_update_at)}
                  </div>
                </td>
                <td className={marketClass.tableCell}>
                  <div className="grid gap-2 text-xs">
                    <Link
                      className={marketClass.strongLink}
                      href={countryQueryHref(
                        "/postgres-preview/projects",
                        country.country
                      )}
                    >
                      {formatCount(country.project_count)} projects
                    </Link>
                    <span className={marketClass.muted}>
                      {formatCount(country.active_project_count)} active
                    </span>
                    <Link
                      className={marketClass.strongLink}
                      href={countryQueryHref(
                        "/postgres-preview/operating-assets",
                        country.country
                      )}
                    >
                      {formatCount(country.operating_asset_count)} plants
                    </Link>
                    <span className={marketClass.muted}>
                      {formatCount(country.operating_asset_active_count)} active
                    </span>
                    <Link
                      className={marketClass.strongLink}
                      href={countryQueryHref(
                        "/postgres-preview/companies",
                        country.country
                      )}
                    >
                      {formatCount(country.company_count)} companies
                    </Link>
                  </div>
                </td>
                <td className={marketClass.tableCell}>
                  <div className={`font-semibold ${marketClass.title}`}>
                    {formatMw(country.operating_installed_mwe)} MWe operating
                  </div>
                  <div className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
                    {formatMw(country.operating_running_mwe)} MWe running
                    <br />
                    {formatMw(country.project_pipeline_mwe)} MWe pipeline
                  </div>
                </td>
                <td className={marketClass.tableCell}>
                  <div className={`font-semibold ${marketClass.title}`}>
                    {formatCount(
                      country.direct_use_project_count +
                        country.direct_use_asset_count
                    )}{" "}
                    direct-use items
                  </div>
                  <div className={`mt-1 text-xs leading-5 ${marketClass.muted}`}>
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
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/analysis",
                        country.country
                      )}
                    >
                      Analysis
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/map",
                        country.country
                      )}
                    >
                      Map
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/projects",
                        country.country
                      )}
                    >
                      Projects
                    </Link>
                    <Link
                      className={marketClass.tableLink}
                      href={countryQueryHref(
                        "/postgres-preview/operating-assets",
                        country.country
                      )}
                    >
                      Plants
                    </Link>
                    <Link
                      className={marketClass.tableLink}
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
      <section className={marketClass.panel}>
        <div className={marketClass.hero}>
          <p className={marketClass.kicker}>
            Market Intelligence
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${marketClass.title}`}>
                Markets
              </h1>
              <p className={`mt-4 max-w-4xl text-sm leading-6 sm:text-base sm:leading-7 ${marketClass.body}`}>
                Market intelligence layer for regional and country-market
                drilldowns, filtered worklists, and
                replacement-readiness checks. TGE regions are the primary market
                framework; World Bank regions remain available as a secondary
                reporting taxonomy.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Link
                className={marketClass.action}
                href="/postgres-preview"
              >
                Back to Command Center
              </Link>
              <Link
                className={marketClass.action}
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
              <div className={marketClass.activeFilter}>
                <div>
                  <span className="font-semibold">Active market filter:</span>{" "}
                  {activeFilterLabel}
                </div>
                <Link
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)] hover:underline"
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
                note="Direct-use projects and plants"
                value={formatCount(totals.directUseRecords)}
              />
              <StatTile
                label="Source Gaps"
                note="Items without confirmed evidence links"
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
