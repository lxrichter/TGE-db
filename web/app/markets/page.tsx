import Link from "next/link";

import { formatCount, formatMw } from "@/lib/format";
import {
  listPostgresCountryMarketSummaries,
  type PostgresCountryMarketSummary,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] shadow-sm";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const brandLinkClass = "text-[var(--tge-brand-green-dark)]";

type RegionSummary = {
  region: string;
  countryCount: number;
  operatingMwe: number;
  pipelineMwe: number;
  activeProjects: number;
  sourceGaps: number;
};

async function getMarketRows() {
  try {
    return {
      ok: true as const,
      rows: await listPostgresCountryMarketSummaries(250),
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown PostgreSQL error",
      rows: [],
    };
  }
}

function summarizeRegions(rows: PostgresCountryMarketSummary[]) {
  const regions = new Map<string, RegionSummary>();

  rows.forEach((row) => {
    const region = row.tge_region || "Unclassified";
    const current = regions.get(region) ?? {
      region,
      countryCount: 0,
      operatingMwe: 0,
      pipelineMwe: 0,
      activeProjects: 0,
      sourceGaps: 0,
    };

    current.countryCount += 1;
    current.operatingMwe += row.operating_installed_mwe;
    current.pipelineMwe += row.project_pipeline_mwe;
    current.activeProjects += row.active_project_count;
    current.sourceGaps += row.missing_source_count;
    regions.set(region, current);
  });

  return [...regions.values()].sort(
    (a, b) => b.operatingMwe + b.pipelineMwe - (a.operatingMwe + a.pipelineMwe)
  );
}

function maxRegionSignal(regions: RegionSummary[]) {
  return Math.max(
    ...regions.map((region) => region.operatingMwe + region.pipelineMwe),
    1
  );
}

function MarketPathCard({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${panelClass} block transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]`}
    >
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <h2 className={`text-xl font-bold ${titleTextClass}`}>{title}</h2>
      </div>

      <div className="px-5 py-5">
        <p className={`text-sm leading-7 ${bodyTextClass}`}>{text}</p>
        <div className={`mt-5 text-xs font-semibold uppercase tracking-wide ${brandLinkClass}`}>
          Open {title}
        </div>
      </div>
    </Link>
  );
}

function MarketKpi({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "operating" | "pipeline" | "market" | "governance" | "neutral";
}) {
  const toneClass =
    tone === "operating"
      ? "border-l-[var(--tge-status-bar-operating)] bg-[var(--tge-governance-success-bg)]"
      : tone === "pipeline"
        ? "border-l-[var(--tge-governance-info-text)] bg-[var(--tge-governance-info-bg)]"
        : tone === "market"
          ? "border-l-[var(--tge-status-bar-attention)] bg-[var(--tge-governance-attention-bg)]"
          : tone === "governance"
            ? "border-l-[var(--tge-governance-attention-text)] bg-[var(--tge-governance-attention-bg)]"
            : "border-l-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";

  return (
    <div className={`border border-l-4 border-transparent ${toneClass} px-5 py-5 shadow-sm`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {label}
      </div>
      <div className={`mt-3 text-3xl font-bold leading-none ${titleTextClass} xl:text-[2.35rem]`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${bodyTextClass}`}>{note}</div>
    </div>
  );
}

function RegionOverview({ regions }: { regions: RegionSummary[] }) {
  const maxSignal = maxRegionSignal(regions);

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <h2 className={`text-lg font-bold ${titleTextClass}`}>
          TGE Regional Intelligence Overview
        </h2>
        <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
          TGE regions are the primary market-intelligence taxonomy. World Bank
          regions remain secondary for external benchmarking.
        </p>
      </div>
      <div className="divide-y divide-[var(--tge-governance-muted-border)]">
        {regions.slice(0, 7).map((region) => {
          const signal = region.operatingMwe + region.pipelineMwe;
          const width = `${Math.max(8, (signal / maxSignal) * 100)}%`;
          const operatingShare =
            signal > 0 ? (region.operatingMwe / signal) * 100 : 0;
          const pipelineShare =
            signal > 0 ? (region.pipelineMwe / signal) * 100 : 0;

          return (
            <Link
              key={region.region}
              href={`/markets/regions/${encodeURIComponent(region.region.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and"))}`}
              className="block px-5 py-5 transition hover:bg-[var(--tge-governance-success-bg)]"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.7fr)_minmax(420px,1fr)_minmax(160px,0.35fr)] xl:items-center">
                <div className="min-w-0">
                  <div className={`font-bold ${titleTextClass}`}>{region.region}</div>
                  <div className={`mt-1 text-xs ${bodyTextClass}`}>
                    {formatCount(region.countryCount)} countries ·{" "}
                    {formatCount(region.activeProjects)} active projects ·{" "}
                    {formatCount(region.sourceGaps)} source gaps
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap justify-between gap-x-5 gap-y-1 text-xs font-semibold text-[var(--tge-governance-muted-text)]">
                    <span>
                      <span className="text-[var(--tge-status-bar-operating)]">
                        {formatMw(region.operatingMwe)} MWe
                      </span>{" "}
                      operating
                    </span>
                    <span>
                      <span className="text-[var(--tge-governance-info-text)]">
                        {formatMw(region.pipelineMwe)} MWe
                      </span>{" "}
                      pipeline
                    </span>
                  </div>
                  <div className="mt-2 h-3 bg-[var(--tge-governance-neutral-bg)]">
                    <div
                      className="flex h-3 overflow-hidden"
                      style={{ width }}
                    >
                      <div
                        className="h-3 bg-[var(--tge-status-bar-success)]"
                        style={{ width: `${operatingShare}%` }}
                      />
                      <div
                        className="h-3 bg-[var(--tge-governance-info-text)]"
                        style={{ width: `${pipelineShare}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-[var(--tge-text-primary)] xl:text-right">
                  {formatMw(signal)} MWe total signal
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CountryRankingTable({
  rows,
}: {
  rows: PostgresCountryMarketSummary[];
}) {
  const topRows = [...rows]
    .sort(
      (a, b) =>
        b.operating_installed_mwe +
        b.project_pipeline_mwe -
        (a.operating_installed_mwe + a.project_pipeline_mwe)
    )
    .slice(0, 10);

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Country Market Rankings
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Combined operating and pipeline capacity signals with evidence-gap
            visibility.
          </p>
        </div>
        <Link
          href="/markets/countries"
          className="inline-flex h-9 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)]"
        >
          All Countries
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            <tr>
              <th className="w-[26%] px-5 py-3 font-semibold">Country</th>
              <th className="w-[18%] px-5 py-3 font-semibold">TGE Region</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Projects</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Source Gaps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {topRows.map((row) => (
              <tr key={`${row.country}-${row.iso3}`} className="align-top hover:bg-[var(--tge-surface-subtle)]">
                <td className="px-5 py-4">
                  <Link
                    href={`/markets/countries/${encodeURIComponent(row.country.toLowerCase().replaceAll(" ", "-"))}`}
                    className={`font-semibold ${titleTextClass} hover:text-[var(--tge-brand-green-dark)] hover:underline`}
                  >
                    {row.country}
                  </Link>
                  {row.iso3 ? (
                    <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                      {row.iso3}
                    </div>
                  ) : null}
                </td>
                <td className={`px-5 py-4 ${bodyTextClass}`}>{row.tge_region || "-"}</td>
                <td className={`px-5 py-4 ${bodyTextClass}`}>
                  {formatMw(row.operating_installed_mwe)} MWe
                </td>
                <td className={`px-5 py-4 ${bodyTextClass}`}>
                  {formatMw(row.project_pipeline_mwe)} MWe
                </td>
                <td className={`px-5 py-4 ${bodyTextClass}`}>
                  {formatCount(row.active_project_count)}
                </td>
                <td className={`px-5 py-4 ${bodyTextClass}`}>
                  {formatCount(row.missing_source_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function MarketsPage() {
  const data = await getMarketRows();
  const rows = data.rows;
  const regions = summarizeRegions(rows);
  const operatingMwe = rows.reduce(
    (total, row) => total + row.operating_installed_mwe,
    0
  );
  const pipelineMwe = rows.reduce(
    (total, row) => total + row.project_pipeline_mwe,
    0
  );
  const activeProjects = rows.reduce(
    (total, row) => total + row.active_project_count,
    0
  );
  const sourceGaps = rows.reduce(
    (total, row) => total + row.missing_source_count,
    0
  );

  return (
    <main className="space-y-8">
      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Markets
              </p>
              <h1 className={`mt-3 text-3xl font-bold tracking-tight ${titleTextClass} xl:text-[2.75rem]`}>
                Global Geothermal Market Intelligence
              </h1>
              <p className={`mt-3 max-w-5xl text-base leading-7 ${bodyTextClass}`}>
                Regional and country intelligence for geothermal operating
                capacity, project pipeline, evidence coverage, source gaps, and
                future market report drilldowns.
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap xl:justify-end">
              <Link
                href="/markets/countries"
                className="inline-flex h-10 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-text-primary)] hover:bg-[var(--tge-governance-success-bg)]"
              >
                Country Markets
              </Link>
              <Link
                href="/markets/regions"
                className="inline-flex h-10 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
              >
                Regional Markets
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-4 sm:px-8">
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${bodyTextClass}`}>
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Market Taxonomy
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Primary</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              TGE regions
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Secondary</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              World Bank regions for benchmarking
            </span>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-4 text-sm leading-6 text-[var(--tge-governance-attention-text)]">
          Market intelligence is unavailable until PostgreSQL is connected.
          Error: {data.error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-[1.25fr_1.25fr_0.9fr_0.9fr]">
        <MarketKpi
          label="Operating MWe"
          note="Installed operating capacity signal"
          tone="operating"
          value={`${formatMw(operatingMwe)} MWe`}
        />
        <MarketKpi
          label="Pipeline MWe"
          note="Development capacity signal"
          tone="pipeline"
          value={`${formatMw(pipelineMwe)} MWe`}
        />
        <MarketKpi
          label="Active Projects"
          note="Current project activity"
          tone="market"
          value={formatCount(activeProjects)}
        />
        <MarketKpi
          label="Source Gaps"
          note="Market evidence follow-up"
          tone="governance"
          value={formatCount(sourceGaps)}
        />
      </section>

      {regions.length > 0 ? <RegionOverview regions={regions} /> : null}
      {rows.length > 0 ? <CountryRankingTable rows={rows} /> : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MarketPathCard
          title="Country Markets"
          text="Browse country-market drilldowns with capacity, plant counts, project pipeline by phase, maps, and linked project/plant/company profiles."
          href="/markets/countries"
        />

        <MarketPathCard
          title="Regional Markets"
          text="Browse TGE regional drilldowns with regional capacity, market coverage, pipeline signals, country summaries, and map links."
          href="/markets/regions"
        />

        <MarketPathCard
          title="Reports"
          text="Future subscriber-ready report products will use approved market intelligence, evidence-backed signals, and analysis modules."
          href="/reports"
        />
      </section>
    </main>
  );
}
