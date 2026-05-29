import type { ReactNode } from "react";

const navGroups = [
  {
    label: "Intelligence",
    items: [
      "Dashboard",
      "Markets",
      "Analysis",
      "Map Explorer",
      "Projects",
      "Plants",
      "Companies",
    ],
  },
  {
    label: "Operations",
    items: ["Research Ops", "Sources", "Validation Queue", "AI Review"],
  },
  {
    label: "Platform",
    items: ["Reports", "Documents", "Admin", "Settings"],
  },
];

const kpis = [
  {
    label: "Operating Capacity",
    value: "17,386.8",
    unit: "MWe",
    note: "+312 MWe confirmed since last update",
    tone: "--tge-concept-green",
  },
  {
    label: "Pipeline Capacity",
    value: "38,240.5",
    unit: "MWe",
    note: "+1,120 MWe under active review",
    tone: "--tge-concept-teal",
  },
  {
    label: "Active Markets",
    value: "102",
    unit: "countries",
    note: "18 with recent intelligence signals",
    tone: "--tge-concept-blue",
  },
  {
    label: "Evidence Confidence",
    value: "71",
    unit: "%",
    note: "priority records source-backed",
    tone: "--tge-concept-gold",
  },
];

const lifecycle = [
  ["Prospect / TBD", "8,840", 18, "--tge-concept-slate"],
  ["Exploration", "12,240", 25, "--tge-concept-blue"],
  ["Pre-Feasibility", "6,980", 14, "--tge-concept-violet"],
  ["Feasibility", "7,420", 15, "--tge-concept-teal"],
  ["Construction", "4,860", 10, "--tge-concept-gold"],
  ["Operating", "17,386", 36, "--tge-concept-green"],
];

const regions = [
  ["Asia & Pacific", "8,420", "19,240", 92, "High activity"],
  ["Europe", "3,930", "7,180", 58, "Policy momentum"],
  ["Africa", "1,020", "6,940", 52, "Pipeline-heavy"],
  ["North America", "4,610", "2,880", 42, "Operating-heavy"],
  ["South America", "720", "3,410", 31, "Emerging pipeline"],
  ["Central America & Caribbean", "970", "1,820", 28, "Selective growth"],
];

const countryMovers = [
  ["Indonesia", "2,408 MWe", "8,900 MWe", "+6 signals", "--tge-concept-green"],
  ["Kenya", "986 MWe", "3,720 MWe", "+4 signals", "--tge-concept-gold"],
  ["Türkiye", "1,691 MWe", "2,140 MWe", "+3 signals", "--tge-concept-teal"],
  ["United States", "3,794 MWe", "2,880 MWe", "+5 signals", "--tge-concept-blue"],
  ["Philippines", "1,928 MWe", "920 MWe", "+2 signals", "--tge-concept-green"],
];

const signals = [
  {
    type: "Drilling",
    market: "Kenya",
    headline: "New drilling campaign advances Rift Valley development cluster",
    source: "TGE article - evidence linked",
    confidence: "High",
  },
  {
    type: "Financing",
    market: "United States",
    headline: "Private capital round signals growth in next-generation geothermal",
    source: "Company source - under review",
    confidence: "Medium",
  },
  {
    type: "Tender",
    market: "Indonesia",
    headline: "Tender activity strengthens Southeast Asia pipeline visibility",
    source: "Government document - credible",
    confidence: "High",
  },
  {
    type: "Commissioning",
    market: "Iceland",
    headline: "Operating fleet update changes installed capacity signal",
    source: "Plant source - confirmed",
    confidence: "High",
  },
];

const evidenceSignals = [
  ["Source-backed priority records", "71%", 71, "--tge-concept-green"],
  ["Open evidence gaps", "248", 38, "--tge-concept-gold"],
  ["Fact candidates awaiting review", "1,204", 54, "--tge-concept-blue"],
  ["Match candidates awaiting review", "612", 42, "--tge-concept-teal"],
];

function cssToken(token: string) {
  return `var(${token})`;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
      <div className="grid min-h-[1180px] grid-cols-1 xl:grid-cols-[280px_1fr]">
        <aside className="hidden bg-[var(--tge-concept-forest-deep)] px-4 py-5 text-[var(--tge-header-text)] xl:flex xl:flex-col">
          <div className="flex items-center gap-3 border-b border-[var(--tge-header-group-divider)] pb-5">
            <img
              alt="ThinkGeoEnergy"
              className="h-10 w-auto shrink-0"
              src="/tge-logo-white.png"
            />
            <div>
              <div className="text-sm font-bold">TGE Intelligence</div>
              <div className="mt-1 text-[11px] text-[var(--tge-header-text-muted)]">
                Geothermal market intelligence
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-7">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--tge-header-text-faint)]">
                  {group.label}
                </div>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const active = item === "Dashboard";
                    return (
                      <div
                        className={`flex min-h-9 items-center justify-between px-3 text-sm font-semibold ${
                          active
                            ? "bg-[var(--tge-concept-lime)] text-[var(--tge-concept-forest-deep)]"
                            : "text-[var(--tge-header-text-soft)]"
                        }`}
                        key={item}
                      >
                        <span>{item}</span>
                        {active ? <span className="text-[11px]">Live</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border border-[var(--tge-header-group-divider)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-lime)]">
              Design Intent
            </div>
            <div className="mt-1 text-sm font-bold">Market command center</div>
            <div className="mt-2 text-xs leading-5 text-[var(--tge-header-text-muted)]">
              Governance remains infrastructure under the intelligence layer.
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[var(--tge-concept-paper)]">
          <div className="flex min-h-16 flex-col gap-3 border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
                Dashboard V2 Concept
              </div>
              <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                Signal - Insight - Trend - Market - Entity - Governance
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="min-w-[260px] border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-3 py-2 text-[var(--tge-concept-muted)]">
                Search market, company, project, plant...
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                Alerts
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                AI
              </div>
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
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
          {title}
        </h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--tge-concept-muted)]">
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  unit,
  note,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-muted)]">
          {label}
        </div>
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: cssToken(tone) }}
        />
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-4xl font-bold leading-none tracking-tight text-[var(--tge-concept-ink)]">
          {value}
        </div>
        <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-concept-muted)]">
          {unit}
        </div>
      </div>
      <div className="mt-3 text-xs leading-5 text-[var(--tge-concept-muted)]">
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
    <div className="grid grid-cols-[150px_1fr_92px] items-center gap-3 text-xs">
      <div className="font-semibold text-[var(--tge-concept-ink)]">{label}</div>
      <div className="h-3 bg-[var(--tge-concept-line)]">
        <div
          className="h-3"
          style={{ backgroundColor: cssToken(token), width: `${share}%` }}
        />
      </div>
      <div className="text-right font-bold text-[var(--tge-concept-ink)]">
        {value}
      </div>
    </div>
  );
}

function PipelineStack() {
  const total = lifecycle.reduce((sum, item) => sum + Number(item[2]), 0);

  return (
    <div>
      <div className="flex h-8 overflow-hidden border border-[var(--tge-concept-line)]">
        {lifecycle.map(([label, , share, token]) => (
          <div
            key={label}
            style={{
              backgroundColor: cssToken(String(token)),
              width: `${(Number(share) / total) * 100}%`,
            }}
            title={String(label)}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lifecycle.map(([label, value, share, token]) => (
          <div
            className="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-xs"
            key={label}
          >
            <div
              className="h-3 w-3"
              style={{ backgroundColor: cssToken(String(token)) }}
            />
            <div className="font-semibold text-[var(--tge-concept-ink)]">
              {label}
            </div>
            <div className="text-right text-[var(--tge-concept-muted)]">
              {value} MWe - {share}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionTable() {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)]">
      <div className="grid grid-cols-6 border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
        <div className="col-span-2">TGE Region</div>
        <div>Operating</div>
        <div>Pipeline</div>
        <div>Momentum</div>
        <div>Signal</div>
      </div>
      {regions.map(([region, operating, pipeline, momentum, signal]) => (
        <div
          className="grid grid-cols-6 items-center border-b border-[var(--tge-concept-line)] px-4 py-3 text-sm last:border-b-0"
          key={String(region)}
        >
          <div className="col-span-2 font-bold text-[var(--tge-concept-ink)]">
            {region}
          </div>
          <div className="font-semibold text-[var(--tge-concept-ink)]">
            {operating}
          </div>
          <div className="font-semibold text-[var(--tge-concept-ink)]">
            {pipeline}
          </div>
          <div className="pr-4">
            <div className="h-2.5 bg-[var(--tge-concept-line)]">
              <div
                className="h-2.5 bg-[var(--tge-concept-green)]"
                style={{ width: `${momentum}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-[var(--tge-concept-muted)]">{signal}</div>
        </div>
      ))}
    </div>
  );
}

function MapPreview() {
  const markers = [
    ["20%", "24%", "--tge-concept-green", "Operating cluster"],
    ["42%", "38%", "--tge-concept-gold", "Construction cluster"],
    ["61%", "30%", "--tge-concept-teal", "Pipeline cluster"],
    ["72%", "66%", "--tge-concept-blue", "Exploration cluster"],
    ["33%", "68%", "--tge-concept-green", "Operating cluster"],
    ["52%", "58%", "--tge-concept-violet", "Emerging technology signal"],
  ];

  return (
    <div
      className="relative min-h-[420px] overflow-hidden border border-[var(--tge-concept-line)]"
      style={{
        background:
          "radial-gradient(circle at 25% 28%, var(--tge-concept-map-relief), transparent 18%), radial-gradient(circle at 70% 65%, var(--tge-concept-map-relief), transparent 22%), linear-gradient(135deg, var(--tge-concept-map-land), var(--tge-concept-map-water))",
      }}
    >
      <div className="absolute left-4 top-4 border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
          Spatial Intelligence
        </div>
        <div className="mt-1 text-lg font-bold text-[var(--tge-concept-ink)]">
          Operating + pipeline clusters
        </div>
        <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
          Filters stay secondary. Map stays the product surface.
        </div>
      </div>

      {markers.map(([left, top, token, label]) => (
        <div className="absolute" key={`${left}-${top}`} style={{ left, top }}>
          <div
            className="h-5 w-5 rounded-full border-2 border-[var(--tge-map-marker-stroke)] shadow-md"
            style={{ backgroundColor: cssToken(String(token)) }}
            title={String(label)}
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 grid gap-2 md:grid-cols-3">
        {["Operating", "Pipeline", "Recent Signals"].map((item) => (
          <div
            className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-3 py-2 text-sm font-bold text-[var(--tge-concept-ink)] shadow-sm"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardV2ConceptPage() {
  return (
    <main className="space-y-8">
      <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-6 py-7">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
          Phase 2 / Intelligence Product Design
        </div>
        <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)] md:text-5xl">
          Dashboard V2 - Global geothermal market command center
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-concept-muted)]">
          This concept explores how the platform should feel when opened by a
          subscriber, executive, investor, developer, analyst, or market
          intelligence user. It does not change architecture or workflows.
        </p>
      </section>

      <Shell>
        <main className="space-y-5 p-4 md:p-6">
          <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
                Global Market Pulse
              </div>
              <h2 className="mt-2 max-w-4xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
                What is happening in geothermal right now?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--tge-concept-muted)]">
                The dashboard leads with scale, movement, recent signals, and
                confidence. Governance becomes trust context below the market view.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </div>
            </div>

            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
              <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                Market Movement Indicators
              </div>
              <div className="mt-4 space-y-4">
                <BarRow
                  label="New signals"
                  share={78}
                  token="--tge-concept-green"
                  value="42"
                />
                <BarRow
                  label="Capacity changes"
                  share={62}
                  token="--tge-concept-teal"
                  value="+1.4 GW"
                />
                <BarRow
                  label="Drilling updates"
                  share={48}
                  token="--tge-concept-gold"
                  value="18"
                />
                <BarRow
                  label="Financing signals"
                  share={36}
                  token="--tge-concept-blue"
                  value="11"
                />
              </div>
              <div className="mt-5 border-l-2 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel-soft)] p-3 text-xs leading-5 text-[var(--tge-concept-muted)]">
                Signals should link back to governed sources, but the first
                visual impression is market movement.
              </div>
            </div>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[1fr_0.8fr]">
            <Section
              description="The first major visualization should explain the global geothermal development pipeline by capacity, not just by record count."
              eyebrow="Pipeline"
              title="Global development pipeline by phase"
            >
              <PipelineStack />
            </Section>

            <Section
              description="A compact intelligence feed makes the dashboard feel alive and evidence-backed."
              eyebrow="Recent Intelligence"
              title="Signals that changed the market view"
            >
              <div className="space-y-3">
                {signals.map((signal) => (
                  <div
                    className="border-l-2 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel-soft)] px-3 py-3"
                    key={`${signal.type}-${signal.market}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-muted)]">
                          {signal.type} - {signal.market}
                        </div>
                        <div className="mt-1 text-sm font-bold text-[var(--tge-concept-ink)]">
                          {signal.headline}
                        </div>
                      </div>
                      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
                        {signal.confidence}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[var(--tge-concept-muted)]">
                      {signal.source}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </section>

          <Section
            description="Markets should expose regional momentum before opening country tables or entity lists."
            eyebrow="Regional Momentum"
            title="Where geothermal activity is strongest and moving"
          >
            <RegionTable />
          </Section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Section
              description="Country rankings should be compact, clickable, and capacity-first."
              eyebrow="Country Movers"
              title="Operating leaders and pipeline movers"
            >
              <div className="space-y-3">
                {countryMovers.map(([country, operating, pipeline, signal, token]) => (
                  <div
                    className="grid grid-cols-[12px_1fr_auto_auto_auto] items-center gap-3 border-b border-[var(--tge-concept-line)] pb-3 text-sm last:border-b-0 last:pb-0"
                    key={String(country)}
                  >
                    <div
                      className="h-3 w-3"
                      style={{ backgroundColor: cssToken(String(token)) }}
                    />
                    <div className="font-bold text-[var(--tge-concept-ink)]">
                      {country}
                    </div>
                    <div className="text-xs text-[var(--tge-concept-muted)]">
                      {operating}
                    </div>
                    <div className="text-xs text-[var(--tge-concept-muted)]">
                      {pipeline}
                    </div>
                    <div className="text-xs font-bold text-[var(--tge-concept-ink)]">
                      {signal}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              description="Evidence confidence is present as trust context, not the first thing the user sees."
              eyebrow="Evidence Confidence"
              title="Why the intelligence is trustworthy"
            >
              <div className="space-y-4">
                {evidenceSignals.map(([label, value, share, token]) => (
                  <BarRow
                    key={String(label)}
                    label={String(label)}
                    share={Number(share)}
                    token={String(token)}
                    value={String(value)}
                  />
                ))}
              </div>
            </Section>
          </section>

          <Section
            description="The map preview should behave as spatial intelligence, not a location database."
            eyebrow="Spatial Intelligence"
            title="Map as signature market surface"
          >
            <MapPreview />
          </Section>
        </main>
      </Shell>
    </main>
  );
}
