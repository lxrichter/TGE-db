import type { ReactNode } from "react";
import {
  PageHeader,
  SectionHeader,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeChartLanguageV2,
  tgeSurfaces,
  tgeText,
  tgeTypography,
  type TgeChartPaletteEntry,
} from "@/lib/design-system";

type PhaseEntry = TgeChartPaletteEntry & {
  count: string;
  capacity: string;
  share: number;
};

const phaseData: PhaseEntry[] = tgeChartLanguageV2.lifecycle.map(
  (phase, index) => ({
    ...phase,
    count: ["124", "430", "88", "67", "81", "38", "19"][index],
    capacity: ["n.a.", "3.8 GW", "1.4 GW", "2.2 GW", "1.7 GW", "740 MW", "n.a."][index],
    share: [10, 32, 14, 16, 18, 7, 3][index],
  })
);

const lifecyclePhases = phaseData;

const projectRows = [
  ["Northern Rift Prospect", "Kenya", "Exploration", "210 MWe", "Medium"],
  ["Nevada Binary Repower", "United States", "Pre-Feasibility", "24 MWe", "Low"],
  ["Menengai Phase II", "Kenya", "Feasibility", "70 MWe", "High"],
  ["Dieng Expansion", "Indonesia", "Construction", "110 MWe", "High"],
  ["Olkaria Unit 7", "Kenya", "Operating", "86 MWe", "Confirmed"],
  ["Legacy Concession", "Chile", "Cancelled / Suspended", "n.a.", "Archived"],
] as const;

const marketRows = [
  ["Indonesia", "8.9 GW", "Construction-heavy", [12, 24, 14, 17, 23, 8, 2]],
  ["Kenya", "3.7 GW", "Exploration and construction", [10, 34, 8, 15, 22, 9, 2]],
  ["Türkiye", "2.1 GW", "Feasibility pipeline", [8, 18, 20, 30, 14, 8, 2]],
  ["United States", "2.9 GW", "Binary redevelopment", [16, 22, 23, 18, 9, 10, 2]],
] as const;

const mapMarkers = [
  ["Exploration", 20, 36],
  ["Pre-Feasibility", 34, 58],
  ["Feasibility", 48, 43],
  ["Construction", 63, 64],
  ["Operating", 77, 39],
  ["Construction", 82, 70],
  ["Cancelled / Suspended", 29, 77],
] as const;

const textOnLight = new Set(["prospect"]);

function phaseByLabel(label: string) {
  return (
    phaseData.find((phase) => phase.label === label) ??
    phaseData.find((phase) => phase.key === "prospect") ??
    phaseData[0]
  );
}

function colorFor(phase: PhaseEntry) {
  return phase.cssVar.replace(/\)$/, `, ${phase.hex})`);
}

function textFor(phase: PhaseEntry) {
  return textOnLight.has(phase.key)
    ? "var(--tge-text-primary)"
    : "var(--tge-surface-card)";
}

function LifecyclePill({ phase }: { phase: PhaseEntry }) {
  return (
    <span
      className="inline-flex min-h-7 items-center px-2.5 text-[10px] font-bold uppercase leading-4 tracking-wide"
      style={{ backgroundColor: colorFor(phase), color: textFor(phase) }}
    >
      {phase.label}
    </span>
  );
}

function LifecycleDot({ phase }: { phase: PhaseEntry }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: colorFor(phase) }}
    />
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <div>{children}</div>
    </section>
  );
}

function LifecycleLegend() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {lifecyclePhases.map((phase) => (
        <article className="bg-[var(--tge-surface-card)] p-4" key={phase.key}>
          <div className="h-2 w-16" style={{ backgroundColor: colorFor(phase) }} />
          <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
            {phase.label}
          </div>
          <p className={`${tgeTypography.metadata} mt-1`}>
            {phase.count} projects · {phase.capacity}
          </p>
        </article>
      ))}
    </div>
  );
}

function ProjectTable() {
  return (
    <div className={`${tgeSurfaces.card} overflow-x-auto`}>
      <table className="w-full min-w-[940px] table-fixed text-left">
        <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="w-36 px-4 py-3">Country</th>
            <th className="w-44 px-4 py-3">Lifecycle</th>
            <th className="w-32 px-4 py-3 text-right">MWe</th>
            <th className="w-36 px-4 py-3">Evidence</th>
            <th className="w-28 px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {projectRows.map(([name, country, phaseLabel, capacity, evidence]) => {
            const phase = phaseByLabel(phaseLabel);

            return (
              <tr className={`${tgeTypography.tableBody} hover:bg-[var(--tge-surface-subtle)]`} key={name}>
                <td className="px-0 py-0">
                  <div className="grid grid-cols-[5px_1fr]">
                    <span style={{ backgroundColor: colorFor(phase) }} />
                    <div className="px-4 py-3">
                      <div className={`font-bold ${tgeText.primary}`}>{name}</div>
                      <div className={tgeTypography.metadata}>
                        Source-backed project profile
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`px-4 py-3 ${tgeText.secondary}`}>{country}</td>
                <td className="px-4 py-3">
                  <LifecyclePill phase={phase} />
                </td>
                <td className={`px-4 py-3 text-right font-bold ${tgeText.primary}`}>
                  {capacity}
                </td>
                <td className={`px-4 py-3 ${tgeText.secondary}`}>{evidence}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex min-h-7 items-center border border-[var(--tge-governance-neutral-border)] px-2 text-[11px] font-bold text-[var(--tge-brand-green-dark)]">
                    Open
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProjectCards() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {projectRows.slice(0, 3).map(([name, country, phaseLabel, capacity]) => {
        const phase = phaseByLabel(phaseLabel);

        return (
          <article
            className="border-t-4 bg-[var(--tge-surface-card)] p-4"
            key={name}
            style={{ borderTopColor: colorFor(phase) }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={tgeTypography.pageLabel}>{country}</div>
                <h3 className={`${tgeTypography.subsectionTitle} mt-1 ${tgeText.primary}`}>
                  {name}
                </h3>
              </div>
              <LifecycleDot phase={phase} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <div className={`${tgeTypography.sectionTitle} ${tgeText.primary}`}>
                  {capacity}
                </div>
                <div className={tgeTypography.metadata}>pipeline capacity</div>
              </div>
              <LifecyclePill phase={phase} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DetailHeader() {
  const phase = phaseByLabel("Construction");

  return (
    <div className="bg-[var(--tge-surface-card)]">
      <div className="h-1.5" style={{ backgroundColor: colorFor(phase) }} />
      <div className="grid gap-5 p-6 xl:grid-cols-[1fr_280px]">
        <div>
          <div className={tgeTypography.pageLabel}>Project Profile</div>
          <h2 className={`${tgeTypography.pageTitle} mt-2 ${tgeText.primary}`}>
            Dieng Expansion
          </h2>
          <p className={`${tgeTypography.body} mt-2 max-w-3xl ${tgeText.secondary}`}>
            Project profile headers can use a restrained phase strip so the
            lifecycle state is recognizable before the user reads the metadata.
          </p>
        </div>
        <div className="grid gap-3 bg-[var(--tge-surface-subtle)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className={tgeTypography.metadata}>Lifecycle</span>
            <LifecyclePill phase={phase} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={tgeTypography.metadata}>Capacity</span>
            <strong className={tgeText.primary}>110 MWe</strong>
          </div>
          <div className="h-2 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className="h-2"
              style={{ backgroundColor: colorFor(phase), width: "78%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSummary() {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
      {lifecyclePhases.map((phase) => (
        <article className="bg-[var(--tge-surface-card)] px-4 py-3" key={phase.key}>
          <div className="flex items-center justify-between gap-3">
            <span className={tgeTypography.tableHeader}>{phase.label}</span>
            <LifecycleDot phase={phase} />
          </div>
          <div className={`mt-3 text-2xl font-bold leading-none ${tgeText.primary}`}>
            {phase.count}
          </div>
          <div className={`${tgeTypography.metadata} mt-2`}>{phase.capacity}</div>
        </article>
      ))}
    </div>
  );
}

function MarketRankings() {
  return (
    <div className={`${tgeSurfaces.card} overflow-x-auto`}>
      <table className="w-full min-w-[900px] table-fixed text-left">
        <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
          <tr>
            <th className="px-4 py-3">Market</th>
            <th className="w-32 px-4 py-3 text-right">Pipeline</th>
            <th className="w-52 px-4 py-3">Dominant Signal</th>
            <th className="px-4 py-3">Phase Mix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {marketRows.map(([market, pipeline, signal, shares]) => (
            <tr className={tgeTypography.tableBody} key={market}>
              <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{market}</td>
              <td className={`px-4 py-3 text-right font-bold ${tgeText.primary}`}>{pipeline}</td>
              <td className={`px-4 py-3 ${tgeText.secondary}`}>{signal}</td>
              <td className="px-4 py-3">
                <div className="flex h-3 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                  {lifecyclePhases.map((phase, index) => (
                    <span
                      key={phase.key}
                      style={{
                        backgroundColor: colorFor(phase),
                        width: `${shares[index]}%`,
                      }}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LifecycleCharts() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className={`${tgeSurfaces.card} space-y-4 p-4`}>
        <div className="flex h-14 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
          {lifecyclePhases.map((phase) => (
            <div
              className="flex items-center justify-center px-2 text-[10px] font-bold uppercase tracking-wide"
              key={phase.key}
              style={{
                backgroundColor: colorFor(phase),
                color: textFor(phase),
                width: `${phase.share}%`,
              }}
            >
              {phase.share >= 12 ? phase.label : ""}
            </div>
          ))}
        </div>
        <p className={tgeTypography.metadata}>
          Stacked pipeline views should keep phase order fixed everywhere.
        </p>
      </div>
      <div className={`${tgeSurfaces.card} space-y-3 p-4`}>
        {lifecyclePhases.map((phase) => (
          <div
            className="grid grid-cols-[132px_1fr_72px] items-center gap-3"
            key={phase.key}
          >
            <div className={`${tgeTypography.bodyStrong} truncate ${tgeText.primary}`}>
              {phase.label}
            </div>
            <div className="h-7 bg-[var(--tge-governance-neutral-bg)]">
              <div
                className="h-7"
                style={{ backgroundColor: colorFor(phase), width: `${phase.share * 3}%` }}
              />
            </div>
            <div className={`${tgeTypography.bodyStrong} text-right ${tgeText.primary}`}>
              {phase.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapLayer() {
  return (
    <div className={`${tgeSurfaces.card} p-4`}>
      <div className="relative min-h-[360px] overflow-hidden bg-[var(--tge-concept-map-land)]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M7 35 C22 22, 38 43, 56 29 C72 18, 83 39, 96 30"
            fill="none"
            opacity="0.28"
            stroke="var(--tge-brand-green-dark)"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <path
            d="M12 73 C30 58, 45 53, 62 65 C77 75, 88 57, 98 51"
            fill="none"
            opacity="0.24"
            stroke="var(--tge-chart-ranking-pipeline-capacity)"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
        </svg>
        {mapMarkers.map(([phaseLabel, left, top], index) => {
          const phase = phaseByLabel(phaseLabel);

          return (
            <div
              className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--tge-surface-card)] text-[10px] font-bold shadow-sm"
              key={`${phaseLabel}-${left}-${top}`}
              style={{
                backgroundColor: colorFor(phase),
                color: textFor(phase),
                left: `${left}%`,
                top: `${top}%`,
              }}
              title={phase.label}
            >
              {index + 1}
            </div>
          );
        })}
        <div className="absolute bottom-4 left-4 grid gap-2 bg-[var(--tge-surface-card)] p-3">
          {lifecyclePhases.map((phase) => (
            <div className="flex items-center gap-2" key={phase.key}>
              <LifecycleDot phase={phase} />
              <span className={tgeTypography.metadata}>{phase.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LifecycleLanguagePage() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Lifecycle Language"
        title="Project phase as a recognizable product system"
        description="This exploration shows how lifecycle color can appear across the platform with stronger recognition than small badges, while staying calm enough for a premium intelligence workspace."
        variant="brief"
      />

      <Panel
        title="Lifecycle recognition palette"
        description="The phase system should become recognizable by maturity: grey prospect, light green exploration, green pre-feasibility, dark green feasibility, amber construction, deep green operating, red cancelled."
      >
        <LifecycleLegend />
      </Panel>

      <Panel
        title="Project tables"
        description="Left-edge row indicators, stronger phase pills, and quiet progress bars make phase visible before reading the label."
      >
        <ProjectTable />
      </Panel>

      <Panel
        title="Project cards and profile headers"
        description="Cards and details can carry subtle lifecycle accents without becoming large colored containers."
      >
        <div className="space-y-6">
          <ProjectCards />
          <DetailHeader />
        </div>
      </Panel>

      <Panel
        title="Dashboard summaries"
        description="Phase-colored counts help executives and analysts read portfolio composition quickly."
      >
        <DashboardSummary />
      </Panel>

      <Panel
        title="Market rankings and pipeline views"
        description="Market tables can show phase mix without turning into workflow screens."
      >
        <MarketRankings />
      </Panel>

      <Panel
        title="Lifecycle charts"
        description="Distribution charts, rankings by phase, and pipeline bars should use the same order and colors everywhere."
      >
        <LifecycleCharts />
      </Panel>

      <Panel
        title="Map Explorer layers"
        description="Map layers should support lifecycle filtering and phase recognition while the map remains the dominant intelligence surface."
      >
        <MapLayer />
      </Panel>
    </main>
  );
}
