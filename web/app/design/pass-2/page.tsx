import type { ReactNode } from "react";

const primaryNavigation = [
  "Dashboard / Overview",
  "Projects",
  "Plants",
  "Companies",
  "Markets",
  "Analysis",
  "Map Explorer",
  "Reports",
  "Documents",
];

const researchNavigation = ["Research Ops", "Validation Queue", "AI Assistant"];

const adminNavigation = [
  "Platform Admin",
  "Users",
  "Settings",
  "Audit / Governance",
];

const dashboardKpis = [
  ["Operating MWe", "17,386.8", "confirmed installed power capacity", "primary"],
  ["Pipeline MWe", "38,240.5", "project development pipeline", "primary"],
  ["Markets", "102", "countries with geothermal signal", "secondary"],
  ["Evidence Coverage", "71%", "priority records source-backed", "governance"],
];

const marketRows = [
  ["Asia & Pacific", "8,420", "19,240", "42", "High activity"],
  ["Europe", "3,930", "7,180", "28", "Policy momentum"],
  ["Africa", "1,020", "6,940", "36", "Pipeline-heavy"],
  ["North America", "4,610", "2,880", "18", "Operating-heavy"],
  ["South America", "720", "3,410", "21", "Emerging pipeline"],
];

const analysisCards = [
  ["Developer Analysis", "Attributed project MWe", "Developer roles only", "Ready"],
  ["Owners & Operators", "Weighted owner and operated MWe", "Plant links", "Ready"],
  ["Turbine Technology", "Installed MWe, units, suppliers", "Plant database", "Ready"],
  ["Country Benchmark", "Market maturity and source coverage", "Country taxonomy", "Design"],
];

const lifecycleSegments = [
  ["Prospect", "--tge-concept-slate", "11%"],
  ["Exploration", "--tge-concept-blue", "24%"],
  ["Pre-Feasibility", "--tge-concept-violet", "18%"],
  ["Feasibility", "--tge-concept-teal", "20%"],
  ["Construction", "--tge-concept-gold", "12%"],
  ["Operating", "--tge-concept-green", "15%"],
];

const mapControlGroups: Array<[string, string[]]> = [
  ["Core Layers", ["Plants", "Projects", "Countries", "TGE Regions"]],
  ["Advanced", ["Power / Heat", "Technology", "Resource Type", "Lifecycle"]],
  ["Future", ["Lithium", "EGS", "Superhot", "Presentation Mode"]],
];

const componentSystem = [
  ["KPI cards", "Large MWe-first hierarchy for executive metrics"],
  ["Insight cards", "Compact narrative + signal + action"],
  ["Tables", "Ranked intelligence tables with bars and drilldowns"],
  ["Filters", "Compact, grouped, collapsible controls"],
  ["Status chips", "Semantic color only, never decorative color"],
  ["Map panels", "Secondary controls; map remains dominant"],
];

const typographyScale = [
  ["Display", "44 / 52", "Page-level intelligence titles"],
  ["Section title", "24 / 32", "Major page modules"],
  ["Card title", "16 / 24", "Reusable component headings"],
  ["Metric", "36 / 40", "Primary market values"],
  ["Body", "14 / 22", "Readable operating text"],
  ["Micro label", "11 / 16", "Eyebrows, status, metadata"],
];

function cssToken(token: string) {
  return `var(${token})`;
}

function ConceptSection({
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
        <h2 className="mt-1 max-w-5xl text-2xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
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

function NavigationGroup({
  title,
  items,
  active,
}: {
  title: string;
  items: string[];
  active?: string;
}) {
  return (
    <div>
      <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--tge-header-text-faint)]">
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {items.map((item) => {
          const isActive = item === active;
          return (
            <div
              key={item}
              className={`flex min-h-9 items-center justify-between px-3 text-sm font-semibold ${
                isActive
                  ? "bg-[var(--tge-concept-lime)] text-[var(--tge-concept-forest-deep)]"
                  : "text-[var(--tge-header-text-soft)]"
              }`}
            >
              <span>{item}</span>
              {isActive ? <span className="text-[11px]">Active</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesignShell({
  active = "Dashboard / Overview",
  children,
}: {
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] shadow-sm">
      <div className="grid min-h-[900px] grid-cols-1 xl:grid-cols-[292px_1fr]">
        <aside className="hidden min-h-full bg-[var(--tge-concept-forest-deep)] px-4 py-5 text-[var(--tge-header-text)] xl:flex xl:flex-col">
          <div className="flex items-center gap-3 border-b border-[var(--tge-header-group-divider)] pb-5">
            <img
              alt="ThinkGeoEnergy"
              className="h-10 w-auto shrink-0"
              src="/tge-logo-white.png"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">
                TGE Intelligence
              </div>
              <div className="mt-1 truncate text-[11px] text-[var(--tge-header-text-muted)]">
                Geothermal Intelligence Operating System
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-7">
            <NavigationGroup
              active={active}
              items={primaryNavigation}
              title="Primary Intelligence"
            />
            <NavigationGroup
              active={active}
              items={researchNavigation}
              title="Research Ops"
            />
            <NavigationGroup
              active={active}
              items={adminNavigation}
              title="Administration"
            />
          </nav>

          <div className="border border-[var(--tge-header-group-divider)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-lime)]">
              Workspace
            </div>
            <div className="mt-1 text-sm font-bold">Internal + Subscriber Ready</div>
            <div className="mt-2 text-xs leading-5 text-[var(--tge-header-text-muted)]">
              Navigation emphasis changes by role; visual language stays shared.
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[var(--tge-concept-paper)]">
          <div className="flex min-h-16 flex-col gap-3 border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 text-xs font-bold text-[var(--tge-concept-ink)] xl:hidden">
                Menu
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
                  Utility Bar
                </div>
                <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                  Search, notifications, AI assistant, profile, context actions
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="min-w-[260px] border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-3 py-2 text-[var(--tge-concept-muted)]">
                Global search...
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                AI
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                Alerts
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                Profile
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  note,
  type,
}: {
  label: string;
  value: string;
  note: string;
  type: string;
}) {
  const accent =
    type === "primary"
      ? "border-l-[var(--tge-concept-green)]"
      : type === "governance"
        ? "border-l-[var(--tge-concept-gold)]"
        : "border-l-[var(--tge-concept-slate)]";

  return (
    <div
      className={`border border-l-4 border-[var(--tge-concept-line)] ${accent} bg-[var(--tge-concept-panel)] p-4`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tge-concept-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 font-bold tracking-tight text-[var(--tge-concept-ink)] ${
          type === "primary" ? "text-4xl" : "text-2xl"
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
    <div className="grid grid-cols-[132px_1fr_92px] items-center gap-3 text-xs">
      <div className="font-semibold text-[var(--tge-concept-ink)]">{label}</div>
      <div className="h-2.5 bg-[var(--tge-concept-line)]">
        <div
          className="h-2.5"
          style={{ backgroundColor: cssToken(token), width: `${share}%` }}
        />
      </div>
      <div className="text-right font-semibold text-[var(--tge-concept-ink)]">
        {value}
      </div>
    </div>
  );
}

function DashboardConcept() {
  return (
    <DesignShell active="Dashboard / Overview">
      <main className="space-y-5 p-4 md:p-6">
        <div className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
          <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
              Dashboard / Executive Intelligence
            </div>
            <h3 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
              Global geothermal intelligence at operating scale
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--tge-concept-muted)]">
              The dashboard is the subscriber-ready intelligence front door.
              Governance is visible only where it affects confidence.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {dashboardKpis.map(([label, value, note, type]) => (
                <KpiCard
                  key={label}
                  label={label}
                  note={note}
                  type={type}
                  value={value}
                />
              ))}
            </div>
          </section>

          <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Intelligence Visualization Language
            </div>
            <div className="mt-4 space-y-3">
              <BarRow label="Operating" share={82} token="--tge-concept-green" value="17.4 GW" />
              <BarRow label="Pipeline" share={68} token="--tge-concept-teal" value="38.2 GW" />
              <BarRow label="Construction" share={34} token="--tge-concept-gold" value="4.8 GW" />
              <BarRow label="Exploration" share={52} token="--tge-concept-blue" value="12.2 GW" />
            </div>
            <div className="mt-5 border-l-2 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel-soft)] p-3 text-xs leading-5 text-[var(--tge-concept-muted)]">
              Charts remain restrained, semantic, and clickable into market,
              map, or entity drilldowns.
            </div>
          </section>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[1fr_1fr_0.75fr]">
          <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5 2xl:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                  Market Signals
                </div>
                <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
                  Regional movement, top countries, activity signals, and source coverage.
                </div>
              </div>
              <div className="border border-[var(--tge-concept-green)] bg-[var(--tge-concept-mint)] px-3 py-2 text-xs font-bold text-[var(--tge-concept-ink)]">
                Open Markets
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {marketRows.slice(0, 4).map((row) => (
                <div key={row[0]} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-[var(--tge-concept-ink)]">{row[0]}</div>
                    <div className="text-xs font-semibold text-[var(--tge-concept-muted)]">{row[4]}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--tge-concept-muted)]">
                    <div><strong className="text-[var(--tge-concept-ink)]">{row[1]}</strong><br />Operating</div>
                    <div><strong className="text-[var(--tge-concept-ink)]">{row[2]}</strong><br />Pipeline</div>
                    <div><strong className="text-[var(--tge-concept-ink)]">{row[3]}</strong><br />Signals</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Recent Intelligence
            </div>
            <div className="mt-4 space-y-3 text-xs">
              {["Drilling update", "Financing signal", "PPA / offtake", "Commissioning"].map((signal) => (
                <div key={signal} className="border-l-2 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel-soft)] px-3 py-2">
                  <div className="font-bold text-[var(--tge-concept-ink)]">{signal}</div>
                  <div className="mt-1 text-[var(--tge-concept-muted)]">
                    Source-linked article signal
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </DesignShell>
  );
}

function MarketsConcept() {
  return (
    <DesignShell active="Markets">
      <main className="space-y-5 p-4 md:p-6">
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
              Markets
            </div>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
              TGE regions first, country drilldowns second
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--tge-concept-muted)]">
              Markets should answer where geothermal activity is strongest
              before exposing workflow categories. World Bank regions remain an
              alternate benchmark taxonomy.
            </p>
            <div className="mt-5 space-y-3">
              <BarRow label="Asia & Pacific" share={90} token="--tge-concept-teal" value="27.7 GW" />
              <BarRow label="Europe" share={52} token="--tge-concept-blue" value="11.1 GW" />
              <BarRow label="Africa" share={40} token="--tge-concept-gold" value="8.0 GW" />
              <BarRow label="N. America" share={38} token="--tge-concept-green" value="7.5 GW" />
            </div>
          </div>

          <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
            <div className="grid grid-cols-6 border-b border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
              <div className="col-span-2">Region</div>
              <div>Operating</div>
              <div>Pipeline</div>
              <div>Signals</div>
              <div>Status</div>
            </div>
            {marketRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-6 items-center border-b border-[var(--tge-concept-line)] px-4 py-3 text-sm last:border-b-0">
                <div className="col-span-2 font-bold text-[var(--tge-concept-ink)]">{row[0]}</div>
                <div className="font-semibold text-[var(--tge-concept-ink)]">{row[1]}</div>
                <div className="font-semibold text-[var(--tge-concept-ink)]">{row[2]}</div>
                <div className="font-semibold text-[var(--tge-concept-ink)]">{row[3]}</div>
                <div className="text-xs text-[var(--tge-concept-muted)]">{row[4]}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {["Top Operating Markets", "Top Pipeline Markets", "Source Gap Ranking"].map((title) => (
            <div key={title} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
              <div className="text-sm font-bold text-[var(--tge-concept-ink)]">{title}</div>
              <div className="mt-3 space-y-2">
                <BarRow label="Indonesia" share={88} token="--tge-concept-green" value="2.4 GW" />
                <BarRow label="United States" share={72} token="--tge-concept-teal" value="1.9 GW" />
                <BarRow label="Kenya" share={44} token="--tge-concept-gold" value="1.0 GW" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </DesignShell>
  );
}

function AnalysisConcept() {
  return (
    <DesignShell active="Analysis">
      <main className="space-y-5 p-4 md:p-6">
        <section className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
            Analysis
          </div>
          <h3 className="mt-2 text-3xl font-bold text-[var(--tge-concept-ink)]">
            Modular intelligence pages, not static reports
          </h3>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--tge-concept-muted)]">
            Analysis modules combine charts, methodology, relationship logic,
            confidence context, export views, and drilldowns into project,
            plant, company, market, and map surfaces.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {analysisCards.map((card) => (
            <div key={card[0]} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-bold text-[var(--tge-concept-ink)]">{card[0]}</div>
                <div className="border border-[var(--tge-concept-line)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-concept-muted)]">
                  {card[3]}
                </div>
              </div>
              <div className="mt-2 text-sm leading-5 text-[var(--tge-concept-muted)]">{card[1]}</div>
              <div className="mt-3 text-xs font-semibold text-[var(--tge-concept-ink)]">{card[2]}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Lifecycle Benchmark Visual
            </div>
            <div className="mt-4 space-y-3">
              {lifecycleSegments.map(([label, token, value], index) => (
                <BarRow
                  key={label}
                  label={label}
                  share={[22, 58, 46, 52, 30, 38][index]}
                  token={token}
                  value={value}
                />
              ))}
            </div>
          </div>
          <div className="border border-[var(--tge-concept-gold)] bg-[var(--tge-concept-panel-soft)] p-5">
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Governance QA Treatment
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--tge-concept-muted)]">
              Internal analysis pages keep caveats visible without overpowering
              market interpretation: excluded roles, equal splits, missing MWe,
              confidence gaps, and methodology notes.
            </p>
            <div className="mt-4 grid gap-2 text-xs">
              {["Equal-split projects", "Missing MWe", "Excluded supplier roles"].map((item) => (
                <div key={item} className="flex items-center justify-between border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-3 py-2">
                  <span>{item}</span>
                  <span className="font-bold text-[var(--tge-concept-ink)]">Review</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </DesignShell>
  );
}

function MapConcept() {
  return (
    <DesignShell active="Map Explorer">
      <main className="p-4 md:p-6">
        <section className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-forest-deep)]">
          <div className="grid min-h-[760px] grid-cols-1 2xl:grid-cols-[1fr_360px]">
            <div
              className="relative min-h-[560px]"
              style={{
                background:
                  "radial-gradient(circle at 25% 28%, var(--tge-concept-map-relief), transparent 18%), radial-gradient(circle at 70% 65%, var(--tge-concept-map-relief), transparent 20%), linear-gradient(135deg, var(--tge-concept-map-land), var(--tge-concept-map-water))",
              }}
            >
              {[
                ["20%", "24%", "--tge-concept-green", "Operating Plant"],
                ["46%", "42%", "--tge-concept-gold", "Construction Project"],
                ["62%", "28%", "--tge-concept-teal", "Feasibility Project"],
                ["74%", "64%", "--tge-concept-blue", "Exploration Project"],
                ["34%", "66%", "--tge-concept-green", "Operating Plant"],
              ].map(([left, top, token, label]) => (
                <div
                  key={`${left}-${top}`}
                  className="absolute"
                  style={{ left, top }}
                >
                  <div
                    className="h-5 w-5 rounded-full border-2 border-[var(--tge-map-marker-stroke)] shadow-md"
                    style={{ backgroundColor: cssToken(token) }}
                    title={label}
                  />
                </div>
              ))}

              <div className="absolute left-5 top-5 border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
                  Map Explorer
                </div>
                <div className="mt-1 text-lg font-bold text-[var(--tge-concept-ink)]">
                  Spatial intelligence first
                </div>
                <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
                  Clean screenshots and presentation mode supported.
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-3">
                {["Open Record", "Open Research Queue", "Open Market"].map((action) => (
                  <div key={action} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 text-sm font-bold text-[var(--tge-concept-ink)] shadow-sm">
                    {action}
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-l border-[var(--tge-header-group-divider)] bg-[var(--tge-concept-forest-deep)] p-5 text-[var(--tge-header-text)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-lime)]">
                    Collapsible Controls
                  </div>
                  <h3 className="mt-1 text-xl font-bold">Spatial Filters</h3>
                </div>
                <div className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-[11px]">
                  Hide
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {mapControlGroups.map(([title, items]) => (
                  <div key={title} className="border border-[var(--tge-header-group-divider)] p-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--tge-header-text-muted)]">
                      {title}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {items.map((item) => (
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
        </section>
      </main>
    </DesignShell>
  );
}

function ComponentAndMobileConcept() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
          <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
            Component System Direction
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {componentSystem.map(([title, note]) => (
              <div key={title} className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-3">
                <div className="font-bold text-[var(--tge-concept-ink)]">{title}</div>
                <div className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">{note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
          <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
            Typography System
          </div>
          <div className="mt-4 overflow-hidden border border-[var(--tge-concept-line)]">
            {typographyScale.map((row) => (
              <div key={row[0]} className="grid grid-cols-3 border-b border-[var(--tge-concept-line)] px-3 py-2 text-sm last:border-b-0">
                <div className="font-bold text-[var(--tge-concept-ink)]">{row[0]}</div>
                <div className="font-mono text-xs text-[var(--tge-concept-muted)]">{row[1]}</div>
                <div className="text-xs text-[var(--tge-concept-muted)]">{row[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[360px] overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] shadow-sm">
        <div className="flex min-h-14 items-center justify-between bg-[var(--tge-concept-forest-deep)] px-4 text-[var(--tge-header-text)]">
          <div className="font-bold">TGE Intelligence</div>
          <div className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-xs">
            Menu
          </div>
        </div>
        <div className="bg-[var(--tge-concept-paper)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
            Mobile Hierarchy
          </div>
          <div className="mt-1 text-xl font-bold text-[var(--tge-concept-ink)]">
            One task per screen layer
          </div>
          <div className="mt-4 space-y-3">
            <KpiCard
              label="Operating MWe"
              note="Primary metric remains visible and large."
              type="primary"
              value="17,386.8"
            />
            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
              <div className="font-bold text-[var(--tge-concept-ink)]">
                Sidebar becomes drawer
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
                Primary navigation moves into a drawer; top bar keeps search,
                alerts, and profile.
              </p>
            </div>
            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-4">
              <div className="font-bold text-[var(--tge-concept-ink)]">
                Map filters become bottom sheet
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--tge-concept-muted)]">
                The map remains visually dominant even on mobile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassTwoDesignConceptPage() {
  return (
    <main className="space-y-8">
      <section className="border-l-4 border-[var(--tge-concept-green)] bg-[var(--tge-concept-panel)] px-6 py-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
          Design Phase / Pass 2 Concept
        </div>
        <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)] md:text-5xl">
          Full left navigation shell and refined intelligence product language
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-concept-muted)]">
          This concept responds to Pass 1 approval by making the sidebar the
          permanent primary navigation, moving the top bar into utility-only
          behavior, and strengthening Dashboard, Markets, Analysis, Map,
          component, typography, and mobile hierarchy.
        </p>
      </section>

      <ConceptSection
        eyebrow="01 / App Shell"
        title="Full-height left navigation with utility-only top bar"
        description="Primary navigation lives in the sidebar. Research Ops and Administration remain visually separate and role-gated. The top bar handles search, notifications, AI assistant, user profile, and contextual actions."
      >
        <DesignShell>
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard label="Subscriber" note="Dashboard, Markets, Analysis, Map, approved entities." type="primary" value="Intelligence" />
              <KpiCard label="Researcher" note="Research Ops workspace, entity worklists, evidence linking." type="secondary" value="Operations" />
              <KpiCard label="Admin" note="Command Center, users, settings, audit, readiness." type="governance" value="Governance" />
            </div>
          </div>
        </DesignShell>
      </ConceptSection>

      <ConceptSection
        eyebrow="02 / Dashboard"
        title="Executive intelligence front door"
        description="Dashboard emphasizes operating capacity, pipeline capacity, market movement, and evidence confidence. Operational pulse remains secondary."
      >
        <DashboardConcept />
      </ConceptSection>

      <ConceptSection
        eyebrow="03 / Markets"
        title="Market intelligence before workflow buckets"
        description="Markets should compare TGE regions and countries first, with source gaps and work queues supporting the intelligence view rather than leading it."
      >
        <MarketsConcept />
      </ConceptSection>

      <ConceptSection
        eyebrow="04 / Analysis"
        title="Consulting-grade modular analysis environment"
        description="Analysis modules expose methodology, chart language, attribution logic, export readiness, and internal Governance QA without becoming spreadsheet pages."
      >
        <AnalysisConcept />
      </ConceptSection>

      <ConceptSection
        eyebrow="05 / Map Explorer"
        title="Signature spatial intelligence surface"
        description="The map dominates the interface. Filters, search, and controls are collapsible, secondary, and scalable for future geothermal intelligence layers."
      >
        <MapConcept />
      </ConceptSection>

      <ConceptSection
        eyebrow="06 / System"
        title="Typography, components, charts, and mobile hierarchy"
        description="The design system should be calm and premium, with MWe-first hierarchy, restrained semantic color, compact components, and mobile layouts that expose one clear task at a time."
      >
        <ComponentAndMobileConcept />
      </ConceptSection>
    </main>
  );
}
