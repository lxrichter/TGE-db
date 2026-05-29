import type { ReactNode } from "react";

const shellNavigation = [
  {
    group: "Intelligence",
    items: ["Dashboard", "Markets", "Analysis", "Map"],
  },
  {
    group: "Research",
    items: ["Projects", "Plants", "Companies", "Sources"],
  },
  {
    group: "Operations",
    items: ["Research Ops", "Readiness", "Admin"],
  },
];

const brandPalette = [
  ["Forest Ink", "--tge-concept-ink", "Primary type and high-confidence surfaces"],
  ["Deep Forest", "--tge-concept-forest-deep", "Sidebar and immersive map chrome"],
  ["Geothermal Green", "--tge-concept-green", "Primary action and TGE accent"],
  ["Lime Signal", "--tge-concept-lime", "Positive highlight and active route"],
  ["Paper", "--tge-concept-paper", "Workspace background"],
  ["Panel", "--tge-concept-panel", "Cards, tables, and module surfaces"],
];

const chartPalette = [
  ["Operating", "--tge-concept-green"],
  ["Pipeline", "--tge-concept-teal"],
  ["Exploration", "--tge-concept-blue"],
  ["Feasibility", "--tge-concept-violet"],
  ["Construction", "--tge-concept-gold"],
  ["Direct Use", "--tge-concept-orange"],
  ["Other", "--tge-concept-slate"],
];

const lifecyclePalette = [
  ["Prospect", "--tge-concept-slate"],
  ["Exploration", "--tge-concept-blue"],
  ["Pre-Feasibility", "--tge-concept-violet"],
  ["Feasibility", "--tge-concept-teal"],
  ["Construction", "--tge-concept-gold"],
  ["Operating", "--tge-concept-green"],
  ["Cancelled", "--tge-concept-red"],
];

const governancePalette = [
  ["Approved", "--tge-concept-green"],
  ["In Review", "--tge-concept-blue"],
  ["Needs Source", "--tge-concept-gold"],
  ["AI Suggested", "--tge-concept-violet"],
  ["Blocked", "--tge-concept-red"],
  ["Draft", "--tge-concept-slate"],
];

const dashboardMetrics = [
  ["Operating MWe", "17,386.8", "confirmed plant capacity"],
  ["Pipeline MWe", "38,240.5", "project development capacity"],
  ["Markets", "102", "countries with geothermal signal"],
  ["Evidence Coverage", "71%", "source-backed priority records"],
];

const marketsRows = [
  ["Asia & Pacific", "8,420", "19,240", "High activity", "22 gaps"],
  ["Europe", "3,930", "7,180", "Strong policy", "14 gaps"],
  ["Africa", "1,020", "6,940", "Pipeline-heavy", "31 gaps"],
  ["North America", "4,610", "2,880", "Operating-heavy", "9 gaps"],
];

const analysisModules = [
  ["Developer Analysis", "Attributed project MWe", "Relationship logic"],
  ["Owners & Operators", "Weighted owner and operator MWe", "Plant links"],
  ["Turbine Technology", "Installed capacity by technology", "Plant database"],
  ["Country Benchmark", "Market maturity and source coverage", "Country reference"],
];

const mapFilterGroups: Array<[string, string[]]> = [
  ["Core Layers", ["Plants", "Projects", "Countries", "TGE Regions"]],
  ["Development", ["Operating", "Construction", "Feasibility", "Exploration"]],
  ["Future Filters", ["Power / Heat", "Technology", "Resource Type", "Minerals"]],
];

function cssToken(token: string) {
  return `var(${token})`;
}

function ShellFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] shadow-sm">
      <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-[var(--tge-concept-line)] bg-[var(--tge-concept-forest-deep)] px-4 py-5 text-[var(--tge-header-text)] lg:block">
          <div className="flex items-center gap-3 border-b border-[var(--tge-header-group-divider)] pb-5">
            <img
              alt="ThinkGeoEnergy"
              className="h-9 w-auto"
              src="/tge-logo-white.png"
            />
            <div>
              <div className="text-sm font-bold leading-tight">TGE Intelligence</div>
              <div className="mt-1 text-[11px] text-[var(--tge-header-text-muted)]">
                Geothermal operating system
              </div>
            </div>
          </div>
          <nav className="mt-6 space-y-6">
            {shellNavigation.map((group) => (
              <div key={group.group}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-header-text-faint)]">
                  {group.group}
                </div>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const active = item === "Dashboard";
                    return (
                      <div
                        key={item}
                        className={`flex h-9 items-center justify-between px-3 text-sm font-semibold ${
                          active
                            ? "bg-[var(--tge-concept-green)] text-[var(--tge-concept-forest-deep)]"
                            : "text-[var(--tge-header-text-soft)]"
                        }`}
                      >
                        <span>{item}</span>
                        {active ? <span className="text-xs">01</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 bg-[var(--tge-concept-paper)]">
          <div className="flex min-h-14 items-center justify-between border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 md:px-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-green)]">
                Subscriber View
              </div>
              <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                Global geothermal intelligence workspace
              </div>
            </div>
            <div className="hidden min-w-[280px] items-center justify-between border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-3 py-2 text-xs text-[var(--tge-concept-muted)] md:flex">
              <span>Search markets, projects, plants, companies...</span>
              <span className="font-semibold text-[var(--tge-concept-ink)]">/</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
      <div className="border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-green)]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
          {title}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--tge-concept-muted)]">
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ColorSwatch({
  label,
  token,
  note,
}: {
  label: string;
  token: string;
  note?: string;
}) {
  return (
    <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-3">
      <div
        className="h-12 border border-[var(--tge-concept-line)]"
        style={{ backgroundColor: cssToken(token) }}
      />
      <div className="mt-3 text-sm font-bold text-[var(--tge-concept-ink)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[11px] text-[var(--tge-concept-muted)]">
        {token}
      </div>
      {note ? (
        <div className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
          {note}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: string;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4 ${
        emphasis ? "border-l-4 border-l-[var(--tge-concept-green)]" : ""
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 font-bold tracking-tight text-[var(--tge-concept-ink)] ${
          emphasis ? "text-4xl" : "text-2xl"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
        {note}
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  share,
  token,
}: {
  label: string;
  value: string;
  share: number;
  token: string;
}) {
  return (
    <div className="grid grid-cols-[116px_1fr_88px] items-center gap-3 text-xs">
      <div className="font-semibold text-[var(--tge-concept-ink)]">{label}</div>
      <div className="h-2 bg-[var(--tge-concept-line)]">
        <div
          className="h-2"
          style={{ backgroundColor: cssToken(token), width: `${share}%` }}
        />
      </div>
      <div className="text-right font-semibold text-[var(--tge-concept-ink)]">
        {value}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <ShellFrame>
      <main className="space-y-5 p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-green)]">
              Global Snapshot
            </div>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
              Global geothermal market pulse
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--tge-concept-muted)]">
              Executive intelligence first: operating capacity, development
              pipeline, market coverage, evidence quality, and recent signals.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              {dashboardMetrics.map((metric, index) => (
                <MetricCard
                  key={metric[0]}
                  label={metric[0]}
                  note={metric[2]}
                  value={metric[1]}
                  emphasis={index < 2}
                />
              ))}
            </div>
          </div>
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Lifecycle Distribution
            </div>
            <div className="mt-4 space-y-3">
              <BarRow label="Operating" share={78} token="--tge-concept-green" value="17.4 GW" />
              <BarRow label="Construction" share={42} token="--tge-concept-gold" value="4.8 GW" />
              <BarRow label="Feasibility" share={56} token="--tge-concept-teal" value="9.7 GW" />
              <BarRow label="Exploration" share={68} token="--tge-concept-blue" value="12.2 GW" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                  Market And Pipeline Signals
                </div>
                <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
                  Ranked regions, recent activity, and drilldown-ready market signals.
                </div>
              </div>
              <div className="border border-[var(--tge-concept-green)] bg-[var(--tge-concept-mint)] px-3 py-2 text-xs font-bold text-[var(--tge-concept-ink)]">
                Open Markets
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {marketsRows.slice(0, 4).map((row) => (
                <div key={row[0]} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[var(--tge-concept-ink)]">{row[0]}</div>
                    <div className="text-xs font-semibold text-[var(--tge-concept-muted)]">{row[3]}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><strong>{row[1]}</strong><br />Operating MWe</div>
                    <div><strong>{row[2]}</strong><br />Pipeline MWe</div>
                    <div><strong>{row[4]}</strong><br />Source gaps</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Recent Intelligence Signals
            </div>
            <div className="mt-4 space-y-3 text-xs">
              {["Drilling update", "Financing signal", "Plant commissioning", "Policy tender"].map((item) => (
                <div key={item} className="border-l-2 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel-soft)] px-3 py-2">
                  <div className="font-bold text-[var(--tge-concept-ink)]">{item}</div>
                  <div className="mt-1 text-[var(--tge-concept-muted)]">Source-linked market signal placeholder</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </ShellFrame>
  );
}

function MarketsMockup() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-green)]">
          Markets
        </div>
        <h3 className="mt-2 text-2xl font-bold text-[var(--tge-concept-ink)]">
          TGE regional market intelligence
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--tge-concept-muted)]">
          TGE regions are the primary market taxonomy. World Bank regions remain
          available as a secondary benchmark layer.
        </p>
        <div className="mt-5 space-y-3">
          <BarRow label="Asia & Pacific" share={86} token="--tge-concept-teal" value="27.7 GW" />
          <BarRow label="Europe" share={48} token="--tge-concept-blue" value="11.1 GW" />
          <BarRow label="Africa" share={34} token="--tge-concept-gold" value="8.0 GW" />
          <BarRow label="N. America" share={38} token="--tge-concept-green" value="7.5 GW" />
        </div>
      </div>
      <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
        <div className="grid grid-cols-5 border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
          <div className="col-span-2">Region</div>
          <div>Operating</div>
          <div>Pipeline</div>
          <div>Signal</div>
        </div>
        {marketsRows.map((row) => (
          <div key={row[0]} className="grid grid-cols-5 items-center border-b border-[var(--tge-concept-line)] px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-2 font-bold text-[var(--tge-concept-ink)]">{row[0]}</div>
            <div className="font-semibold text-[var(--tge-concept-ink)]">{row[1]}</div>
            <div className="font-semibold text-[var(--tge-concept-ink)]">{row[2]}</div>
            <div className="text-xs text-[var(--tge-concept-muted)]">{row[3]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisMockup() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-green)]">
          Analysis
        </div>
        <h3 className="mt-2 text-2xl font-bold text-[var(--tge-concept-ink)]">
          Modular intelligence registry
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--tge-concept-muted)]">
          Analysis pages should feel closer to consulting-grade intelligence
          outputs than database summaries.
        </p>
        <div className="mt-5 grid gap-2">
          {analysisModules.map((module) => (
            <div key={module[0]} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-3">
              <div className="font-bold text-[var(--tge-concept-ink)]">{module[0]}</div>
              <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">{module[1]}</div>
              <div className="mt-2 inline-flex border border-[var(--tge-concept-line)] px-2 py-1 text-[11px] font-semibold text-[var(--tge-concept-muted)]">
                {module[2]}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Developer Attribution Preview
            </div>
            <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
              MWe-first rankings with explicit Governance QA.
            </div>
          </div>
          <div className="border border-[var(--tge-concept-gold)] bg-[var(--tge-concept-panel-soft)] px-3 py-2 text-xs font-bold text-[var(--tge-concept-ink)]">
            Logic Validation
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <BarRow label="Developer A" share={92} token="--tge-concept-green" value="1,240 MWe" />
          <BarRow label="Developer B" share={64} token="--tge-concept-teal" value="860 MWe" />
          <BarRow label="Developer C" share={38} token="--tge-concept-blue" value="520 MWe" />
          <BarRow label="Developer D" share={24} token="--tge-concept-violet" value="330 MWe" />
        </div>
        <div className="mt-5 border-l-2 border-[var(--tge-concept-gold)] bg-[var(--tge-concept-panel-soft)] p-3 text-xs leading-5 text-[var(--tge-concept-muted)]">
          Governance QA remains visible internally: equal-split projects,
          missing MWe, excluded roles, and attribution caveats.
        </div>
      </div>
    </div>
  );
}

function MapMockup() {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-forest-deep)]">
      <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[1fr_340px]">
        <div
          className="relative min-h-[420px]"
          style={{
            background:
              "linear-gradient(135deg, var(--tge-concept-map-land), var(--tge-concept-map-water))",
          }}
        >
          <div className="absolute left-[16%] top-[22%] h-4 w-4 rounded-full border-2 border-[var(--tge-map-marker-stroke)] bg-[var(--tge-concept-green)] shadow-md" />
          <div className="absolute left-[45%] top-[42%] h-5 w-5 rounded-full border-2 border-[var(--tge-map-marker-stroke)] bg-[var(--tge-concept-gold)] shadow-md" />
          <div className="absolute left-[63%] top-[30%] h-4 w-4 rounded-full border-2 border-[var(--tge-map-marker-stroke)] bg-[var(--tge-concept-teal)] shadow-md" />
          <div className="absolute left-[72%] top-[62%] h-3 w-3 rounded-full border-2 border-[var(--tge-map-marker-stroke)] bg-[var(--tge-concept-blue)] shadow-md" />
          <div className="absolute bottom-5 left-5 border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
              Expanded Map Mode
            </div>
            <div className="mt-1 text-sm font-bold text-[var(--tge-concept-ink)]">
              Map is the dominant surface
            </div>
          </div>
        </div>
        <aside className="border-l border-[var(--tge-header-group-divider)] bg-[var(--tge-concept-forest-deep)] p-5 text-[var(--tge-header-text)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-lime)]">
                Spatial Filters
              </div>
              <h3 className="mt-1 text-xl font-bold">Map Explorer</h3>
            </div>
            <div className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-[11px]">
              Collapse
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {mapFilterGroups.map((group) => (
              <div key={group[0]} className="border border-[var(--tge-header-group-divider)] p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--tge-header-text-muted)]">
                  {group[0]}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group[1].map((item) => (
                    <span key={item} className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-xs text-[var(--tge-header-text-soft)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MobileMockup() {
  return (
    <div className="mx-auto max-w-[360px] overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] shadow-sm">
      <div className="flex h-14 items-center justify-between bg-[var(--tge-concept-forest-deep)] px-4 text-[var(--tge-header-text)]">
        <div className="text-sm font-bold">TGE Intelligence</div>
        <div className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-xs">
          Menu
        </div>
      </div>
      <div className="bg-[var(--tge-concept-paper)] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
          Mobile Priority
        </div>
        <div className="mt-1 text-xl font-bold text-[var(--tge-concept-ink)]">
          Snapshot first, controls second
        </div>
        <div className="mt-4 grid gap-3">
          <MetricCard label="Operating MWe" value="17,386.8" note="Primary KPI remains large." emphasis />
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
            <div className="font-bold text-[var(--tge-concept-ink)]">Map drawer pattern</div>
            <p className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
              Filters move into a drawer; record popups become bottom sheets.
            </p>
          </div>
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
            <div className="font-bold text-[var(--tge-concept-ink)]">Analysis cards</div>
            <p className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
              Tables collapse into ranked cards with one dominant MWe value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassOneDesignConceptPage() {
  return (
    <main className="space-y-8">
      <section className="border-l-4 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel)] px-6 py-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
          Design Phase / Pass 1 Concept
        </div>
        <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)] md:text-5xl">
          App Shell, Dashboard, Markets, Analysis, and Map Explorer
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-concept-muted)]">
          This is a non-production design concept page. It proposes the
          platform-wide visual language before changing the live intelligence
          and operations pages.
        </p>
      </section>

      <Section
        eyebrow="01 / Product Shell"
        title="Left navigation, top utility bar, and role-aware entry points"
        description="The sidebar becomes the primary product navigation. The top bar becomes contextual: search, saved views, export, AI assistant access, notifications, and user profile."
      >
        <ShellFrame>
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Subscriber" value="Dashboard" note="Markets, Analysis, Map visible first." />
              <MetricCard label="Researcher" value="Research Ops" note="Assigned work and entity editing first." />
              <MetricCard label="Admin" value="Command" note="Readiness, users, and vocabularies first." />
            </div>
          </div>
        </ShellFrame>
      </Section>

      <Section
        eyebrow="02 / Dashboard"
        title="Executive intelligence first, operational pulse second"
        description="The dashboard should communicate global geothermal scale and movement before exposing governance. Operating MWe and Pipeline MWe should be visually dominant."
      >
        <DashboardMockup />
      </Section>

      <Section
        eyebrow="03 / Markets"
        title="TGE regions as the primary market intelligence taxonomy"
        description="Markets should prioritize regional comparison, country drilldowns, rankings, and source gap signals. World Bank taxonomy remains secondary."
      >
        <MarketsMockup />
      </Section>

      <Section
        eyebrow="04 / Analysis"
        title="Modular intelligence pages with explicit methodology"
        description="Analysis modules should make MWe and MWth hierarchy clear, keep attribution methodology visible, and treat Governance QA as internal confidence context."
      >
        <AnalysisMockup />
      </Section>

      <Section
        eyebrow="05 / Map Explorer"
        title="Signature spatial intelligence experience"
        description="The map should be dominant. Filters are secondary, collapsible, and scalable for future geothermal intelligence layers."
      >
        <MapMockup />
      </Section>

      <Section
        eyebrow="06 / Visual System"
        title="Proposed palette, typography, charts, and component language"
        description="These tokens are proposed for review. The key principle is semantic consistency: lifecycle colors describe market reality; governance colors describe review state."
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--tge-concept-ink)]">
              Brand / UI Palette
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {brandPalette.map(([label, token, note]) => (
                <ColorSwatch key={label} label={label} note={note} token={token} />
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--tge-concept-ink)]">
                Chart Palette
              </h3>
              <div className="mt-3 grid gap-2">
                {chartPalette.map(([label, token]) => (
                  <ColorSwatch key={label} label={label} token={token} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--tge-concept-ink)]">
                Lifecycle Palette
              </h3>
              <div className="mt-3 grid gap-2">
                {lifecyclePalette.map(([label, token]) => (
                  <ColorSwatch key={label} label={label} token={token} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--tge-concept-ink)]">
                Governance / Review Palette
              </h3>
              <div className="mt-3 grid gap-2">
                {governancePalette.map(([label, token]) => (
                  <ColorSwatch key={label} label={label} token={token} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-5">
              <h3 className="text-lg font-bold text-[var(--tge-concept-ink)]">
                Typography Hierarchy
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
                    Eyebrow / Section Family
                  </div>
                  <div className="mt-1 text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
                    Intelligence Page Title
                  </div>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--tge-concept-muted)]">
                    Body copy stays restrained, readable, and secondary to data.
                    Metrics use large figures only when they are truly primary.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard label="Primary KPI" value="17,386.8" note="Large metric for executive anchor." emphasis />
                  <MetricCard label="Secondary KPI" value="102" note="Quiet supporting metric." />
                  <MetricCard label="Table Value" value="430" note="Compact operational value." />
                </div>
              </div>
            </div>
            <MobileMockup />
          </div>
        </div>
      </Section>
    </main>
  );
}
