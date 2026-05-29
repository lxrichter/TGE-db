import type { ReactNode } from "react";

const navGroups = [
  {
    label: "Intelligence",
    items: [
      "Dashboard",
      "Markets",
      "Analysis",
      "Map Explorer",
      "Reports",
      "Documents",
    ],
  },
  {
    label: "Market Entities",
    items: ["Projects", "Plants", "Companies"],
  },
  {
    label: "Internal",
    items: ["Research Ops", "Sources", "Admin"],
  },
];

const kpis = [
  {
    label: "Operating Capacity",
    value: "17,386.8",
    unit: "MWe",
    note: "+312 MWe confirmed",
    tone: "--tge-concept-green",
    trend: [24, 30, 28, 42, 48, 58, 64],
  },
  {
    label: "Pipeline Capacity",
    value: "38,240.5",
    unit: "MWe",
    note: "+1.1 GW active movement",
    tone: "--tge-concept-teal",
    trend: [18, 26, 34, 42, 48, 62, 76],
  },
  {
    label: "Market Signals",
    value: "42",
    unit: "new",
    note: "18 markets changed",
    tone: "--tge-concept-gold",
    trend: [20, 18, 32, 28, 44, 50, 68],
  },
  {
    label: "Active Markets",
    value: "102",
    unit: "countries",
    note: "pipeline or operating signal",
    tone: "--tge-concept-blue",
    trend: [44, 44, 48, 50, 56, 60, 64],
  },
];

const signalPulse = [
  ["Drilling", "18", "+6", "--tge-concept-gold", 74],
  ["Financing", "11", "+4", "--tge-concept-green", 54],
  ["Policy / Tender", "9", "+3", "--tge-concept-blue", 46],
  ["Construction", "7", "+2", "--tge-concept-teal", 40],
  ["Commissioning", "4", "+1", "--tge-concept-violet", 24],
  ["Company Activity", "13", "+5", "--tge-concept-orange", 62],
];

const lifecycle = [
  ["Prospect / TBD", "8,840", 18, "--tge-concept-slate", "312 projects"],
  ["Exploration", "12,240", 25, "--tge-concept-blue", "418 projects"],
  ["Pre-Feasibility", "6,980", 14, "--tge-concept-violet", "126 projects"],
  ["Feasibility", "7,420", 15, "--tge-concept-teal", "141 projects"],
  ["Construction", "4,860", 10, "--tge-concept-gold", "72 projects"],
  ["Operating", "17,386", 36, "--tge-concept-green", "611 plants"],
];

const regionalMomentum = [
  ["Asia & Pacific", "8.4 GW", "19.2 GW", 92, "--tge-concept-teal"],
  ["Europe", "3.9 GW", "7.2 GW", 58, "--tge-concept-blue"],
  ["Africa", "1.0 GW", "6.9 GW", 52, "--tge-concept-gold"],
  ["North America", "4.6 GW", "2.9 GW", 42, "--tge-concept-green"],
  ["South America", "0.7 GW", "3.4 GW", 31, "--tge-concept-violet"],
  ["Central America & Caribbean", "1.0 GW", "1.8 GW", 28, "--tge-concept-orange"],
];

const countryMovers = [
  ["Indonesia", "2,408 MWe", "8,900 MWe", "Tender + drilling", 92],
  ["Kenya", "986 MWe", "3,720 MWe", "Drilling cluster", 76],
  ["United States", "3,794 MWe", "2,880 MWe", "Capital + EGS", 70],
  ["Türkiye", "1,691 MWe", "2,140 MWe", "Fleet expansion", 56],
  ["Philippines", "1,928 MWe", "920 MWe", "Operating update", 34],
];

const intelligenceFeed = [
  {
    type: "Drilling",
    market: "Kenya",
    headline: "Rift Valley activity increases as drilling campaign advances",
    impact: "Pipeline visibility increased",
    confidence: "High",
    tone: "--tge-concept-gold",
  },
  {
    type: "Financing",
    market: "United States",
    headline: "Private capital signal strengthens next-generation geothermal outlook",
    impact: "Emerging technology signal",
    confidence: "Medium",
    tone: "--tge-concept-green",
  },
  {
    type: "Tender",
    market: "Indonesia",
    headline: "Procurement signal expands Southeast Asia development watchlist",
    impact: "Market momentum increased",
    confidence: "High",
    tone: "--tge-concept-blue",
  },
  {
    type: "Commissioning",
    market: "Iceland",
    headline: "Fleet update changes confirmed operating capacity signal",
    impact: "Installed capacity adjusted",
    confidence: "High",
    tone: "--tge-concept-teal",
  },
];

const trendPoints = [28, 32, 38, 44, 50, 57, 64, 71, 82, 88, 96, 108];
const outlookBars = [
  ["2026", 4.8, 11.2, 17.4],
  ["2027", 5.9, 13.6, 18.2],
  ["2028", 7.2, 15.1, 19.4],
  ["2029", 8.4, 16.9, 20.1],
  ["2030", 9.8, 18.2, 21.4],
];

const evidenceTrust = [
  ["Source-backed priority records", "71%", 71, "--tge-concept-green"],
  ["Signals awaiting review", "248", 38, "--tge-concept-gold"],
  ["Fact candidates", "1,204", 54, "--tge-concept-blue"],
  ["Entity match candidates", "612", 42, "--tge-concept-teal"],
];

function cssToken(token: string) {
  return `var(${token})`;
}

function MiniSparkline({
  points,
  token,
}: {
  points: number[];
  token: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 34 - ((point - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg aria-hidden="true" className="h-10 w-full" viewBox="0 0 100 36">
      <polyline
        fill="none"
        points={coordinates}
        stroke={cssToken(token)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
      <div className="grid min-h-[1180px] grid-cols-1 xl:grid-cols-[272px_1fr]">
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
                Market intelligence platform
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
                        {active ? <span className="text-[11px]">Now</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border border-[var(--tge-header-group-divider)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-lime)]">
              Concept Focus
            </div>
            <div className="mt-1 text-sm font-bold">Market movement first</div>
            <div className="mt-2 text-xs leading-5 text-[var(--tge-header-text-muted)]">
              Governance sits underneath insight as confidence infrastructure.
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
                What changed - where it matters - why it is credible
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="min-w-[280px] border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] px-3 py-2 text-[var(--tge-concept-muted)]">
                Search market, company, project, plant...
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                Alerts 42
              </div>
              <div className="border border-[var(--tge-concept-line)] px-3 py-2 font-semibold text-[var(--tge-concept-ink)]">
                AI Brief
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
      <div className="flex flex-col gap-2 border-b border-[var(--tge-concept-line)] px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
            {title}
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--tge-concept-muted)]">
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
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  tone: string;
  trend: number[];
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
        <div className="text-3xl font-bold leading-none tracking-tight text-[var(--tge-concept-ink)]">
          {value}
        </div>
        <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-concept-muted)]">
          {unit}
        </div>
      </div>
      <div className="mt-3">
        <MiniSparkline points={trend} token={tone} />
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
    <div className="grid grid-cols-[150px_1fr_92px] items-center gap-3 text-xs">
      <div className="font-semibold text-[var(--tge-concept-ink)]">{label}</div>
      <div className="h-4 bg-[var(--tge-concept-line)]">
        <div
          className="flex h-4 items-center justify-end pr-1 text-[9px] font-bold text-[var(--tge-concept-panel)]"
          style={{ backgroundColor: cssToken(token), width: `${share}%` }}
        >
          {share > 36 ? `${share}%` : ""}
        </div>
      </div>
      <div className="text-right font-bold text-[var(--tge-concept-ink)]">
        {value}
      </div>
    </div>
  );
}

function CapacityTrendSurface() {
  const max = Math.max(...trendPoints);
  const min = Math.min(...trendPoints);
  const range = max - min || 1;
  const line = trendPoints
    .map((point, index) => {
      const x = 24 + (index / (trendPoints.length - 1)) * 432;
      const y = 194 - ((point - min) / range) * 144;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `24,194 ${line} 456,194`;

  return (
    <div className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
              Capacity Growth Trajectory
            </div>
            <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
              Indexed global signal from operating additions, pipeline movement,
              and recent source-backed updates.
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--tge-concept-ink)]">
              +14.2%
            </div>
            <div className="text-xs text-[var(--tge-concept-muted)]">
              twelve-month signal
            </div>
          </div>
        </div>
        <svg className="mt-4 h-[230px] w-full" viewBox="0 0 480 220">
          <polygon
            fill="var(--tge-concept-mint)"
            points={area}
            opacity="0.72"
          />
          <polyline
            fill="none"
            points={line}
            stroke="var(--tge-concept-green)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          {[50, 90, 130, 170].map((y) => (
            <line
              key={y}
              stroke="var(--tge-concept-line)"
              strokeWidth="1"
              x1="24"
              x2="456"
              y1={y}
              y2={y}
            />
          ))}
          {trendPoints.map((point, index) => {
            const x = 24 + (index / (trendPoints.length - 1)) * 432;
            const y = 194 - ((point - min) / range) * 144;
            return (
              <circle
                cx={x}
                cy={y}
                fill="var(--tge-concept-panel)"
                key={`${point}-${index}`}
                r="4"
                stroke="var(--tge-concept-green)"
                strokeWidth="3"
              />
            );
          })}
        </svg>
      </div>

      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4">
        <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
          Annual Capacity Outlook
        </div>
        <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
          Indicative view of operating base, construction, and active pipeline.
        </div>
        <div className="mt-5 flex h-[220px] items-end gap-3">
          {outlookBars.map(([year, construction, pipeline, operating]) => {
            const constructionHeight = Number(construction) * 5;
            const pipelineHeight = Number(pipeline) * 5;
            const operatingHeight = Number(operating) * 5;
            return (
              <div className="flex flex-1 flex-col items-center gap-2" key={year}>
                <div className="flex h-[180px] w-full max-w-[60px] flex-col justify-end border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)]">
                  <div
                    style={{
                      backgroundColor: cssToken("--tge-concept-gold"),
                      height: `${constructionHeight}px`,
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: cssToken("--tge-concept-teal"),
                      height: `${pipelineHeight}px`,
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: cssToken("--tge-concept-green"),
                      height: `${operatingHeight}px`,
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-[var(--tge-concept-ink)]">
                  {year}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipelineStack() {
  const total = lifecycle.reduce((sum, item) => sum + Number(item[2]), 0);

  return (
    <div>
      <div className="flex h-11 overflow-hidden border border-[var(--tge-concept-line)]">
        {lifecycle.map(([label, value, share, token]) => (
          <div
            className="flex items-center justify-center px-2 text-[10px] font-bold text-[var(--tge-concept-panel)]"
            key={label}
            style={{
              backgroundColor: cssToken(String(token)),
              width: `${(Number(share) / total) * 100}%`,
            }}
            title={`${label}: ${value} MWe`}
          >
            {Number(share) >= 14 ? `${value}` : ""}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {lifecycle.map(([label, value, share, token, count]) => (
          <div
            className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-3"
            key={label}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3"
                style={{ backgroundColor: cssToken(String(token)) }}
              />
              <div className="text-xs font-bold text-[var(--tge-concept-ink)]">
                {label}
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
              {value} MWe
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--tge-concept-muted)]">
              <span>{count}</span>
              <span>{share}% share</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalPulse() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {signalPulse.map(([label, value, change, token, share]) => (
        <div
          className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4"
          key={String(label)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
                {label}
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold leading-none text-[var(--tge-concept-ink)]">
                  {value}
                </span>
                <span className="pb-1 text-xs font-bold text-[var(--tge-concept-green)]">
                  {change}
                </span>
              </div>
            </div>
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: cssToken(String(token)) }}
            />
          </div>
          <div className="mt-4 h-4 bg-[var(--tge-concept-line)]">
            <div
              className="h-4"
              style={{
                backgroundColor: cssToken(String(token)),
                width: `${share}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionalMomentum() {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        {regionalMomentum.map(([region, operating, pipeline, momentum, token]) => (
          <div
            className="grid grid-cols-[1fr_110px] gap-4 border-b border-[var(--tge-concept-line)] pb-4 last:border-b-0 last:pb-0"
            key={String(region)}
          >
            <div>
              <div className="font-bold text-[var(--tge-concept-ink)]">
                {region}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-[var(--tge-concept-muted)]">
                <div>
                  <strong className="text-[var(--tge-concept-ink)]">
                    {operating}
                  </strong>
                  <br />
                  operating
                </div>
                <div>
                  <strong className="text-[var(--tge-concept-ink)]">
                    {pipeline}
                  </strong>
                  <br />
                  pipeline
                </div>
              </div>
            </div>
            <div>
              <div className="text-right text-xs font-bold text-[var(--tge-concept-ink)]">
                {momentum}
              </div>
              <div className="mt-2 h-20 bg-[var(--tge-concept-line)]">
                <div
                  className="mt-auto"
                  style={{
                    backgroundColor: cssToken(String(token)),
                    height: `${momentum}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4">
        <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
          Regional Operating vs Pipeline Split
        </div>
        <div className="mt-4 space-y-4">
          {regionalMomentum.slice(0, 5).map(([region, operating, pipeline, , token]) => {
            const operatingValue = Number(String(operating).replace(" GW", ""));
            const pipelineValue = Number(String(pipeline).replace(" GW", ""));
            const total = operatingValue + pipelineValue || 1;
            return (
              <div key={String(region)}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-bold text-[var(--tge-concept-ink)]">
                    {region}
                  </span>
                  <span className="text-[var(--tge-concept-muted)]">
                    {(total).toFixed(1)} GW
                  </span>
                </div>
                <div className="flex h-5 overflow-hidden bg-[var(--tge-concept-line)]">
                  <div
                    style={{
                      backgroundColor: cssToken("--tge-concept-green"),
                      width: `${(operatingValue / total) * 100}%`,
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: cssToken(String(token)),
                      width: `${(pipelineValue / total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CountryMovers() {
  return (
    <div className="space-y-4">
      {countryMovers.map(([country, operating, pipeline, signal, share]) => (
        <div
          className="grid gap-3 border-b border-[var(--tge-concept-line)] pb-4 last:border-b-0 last:pb-0 md:grid-cols-[1fr_1.6fr]"
          key={String(country)}
        >
          <div>
            <div className="text-base font-bold text-[var(--tge-concept-ink)]">
              {country}
            </div>
            <div className="mt-1 text-xs font-semibold text-[var(--tge-concept-muted)]">
              {signal}
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[92px_1fr_88px] items-center gap-3 text-xs">
              <span className="font-semibold text-[var(--tge-concept-muted)]">
                Pipeline
              </span>
              <div className="h-5 bg-[var(--tge-concept-line)]">
                <div
                  className="h-5 bg-[var(--tge-concept-teal)]"
                  style={{ width: `${share}%` }}
                />
              </div>
              <span className="text-right font-bold text-[var(--tge-concept-ink)]">
                {pipeline}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[92px_1fr_88px] items-center gap-3 text-xs">
              <span className="font-semibold text-[var(--tge-concept-muted)]">
                Operating
              </span>
              <div className="h-3 bg-[var(--tge-concept-line)]">
                <div
                  className="h-3 bg-[var(--tge-concept-green)]"
                  style={{ width: `${Math.max(24, Number(share) - 18)}%` }}
                />
              </div>
              <span className="text-right font-bold text-[var(--tge-concept-ink)]">
                {operating}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IntelligenceFeed() {
  return (
    <div className="grid gap-3">
      {intelligenceFeed.map((item) => (
        <div
          className="grid gap-3 border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4 md:grid-cols-[120px_1fr_auto]"
          key={`${item.type}-${item.market}`}
        >
          <div>
            <div
              className="inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--tge-concept-panel)]"
              style={{ backgroundColor: cssToken(item.tone) }}
            >
              {item.type}
            </div>
            <div className="mt-2 text-xs font-bold text-[var(--tge-concept-ink)]">
              {item.market}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold leading-5 text-[var(--tge-concept-ink)]">
              {item.headline}
            </div>
            <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
              {item.impact}
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
            {item.confidence}
          </div>
        </div>
      ))}
    </div>
  );
}

function MapPreview() {
  const markers = [
    ["17%", "29%", "--tge-concept-green", "Operating concentration", 42],
    ["35%", "43%", "--tge-concept-gold", "Drilling intensity", 54],
    ["55%", "31%", "--tge-concept-teal", "Pipeline cluster", 64],
    ["75%", "61%", "--tge-concept-blue", "Exploration cluster", 38],
    ["29%", "67%", "--tge-concept-green", "Operating cluster", 30],
    ["62%", "58%", "--tge-concept-violet", "Emerging technology signal", 46],
  ];

  return (
    <div
      className="relative min-h-[520px] overflow-hidden border border-[var(--tge-concept-line)]"
      style={{
        background:
          "radial-gradient(circle at 23% 32%, var(--tge-concept-map-relief), transparent 18%), radial-gradient(circle at 63% 58%, var(--tge-concept-map-relief), transparent 24%), radial-gradient(circle at 80% 24%, var(--tge-concept-mint), transparent 17%), linear-gradient(135deg, var(--tge-concept-map-land), var(--tge-concept-map-water))",
      }}
    >
      <div className="absolute left-4 top-4 max-w-[360px] border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-4 py-3 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-concept-green)]">
          Spatial Intelligence
        </div>
        <div className="mt-1 text-lg font-bold text-[var(--tge-concept-ink)]">
          Activity intensity, not just record locations
        </div>
        <div className="mt-1 text-xs leading-5 text-[var(--tge-concept-muted)]">
          Clusters combine operating capacity, pipeline MWe, and recent market signals.
        </div>
      </div>

      <div className="absolute right-4 top-4 grid gap-2 text-xs">
        {["Capacity", "Pipeline", "Signals"].map((item) => (
          <div
            className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-3 py-2 font-bold text-[var(--tge-concept-ink)] shadow-sm"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>

      {markers.map(([left, top, token, label, size]) => (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          key={`${left}-${top}`}
          style={{ left, top }}
        >
          <div
            className="rounded-full opacity-20"
            style={{
              backgroundColor: cssToken(String(token)),
              height: `${size}px`,
              width: `${size}px`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--tge-map-marker-stroke)] shadow-md"
            style={{ backgroundColor: cssToken(String(token)) }}
            title={String(label)}
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 grid gap-2 md:grid-cols-4">
        {[
          ["Operating concentration", "17.4 GW"],
          ["Pipeline concentration", "38.2 GW"],
          ["Recent signals", "42"],
          ["Source confidence", "71%"],
        ].map(([label, value]) => (
          <div
            className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] px-3 py-2 shadow-sm"
            key={label}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
              {label}
            </div>
            <div className="mt-1 text-base font-bold text-[var(--tge-concept-ink)]">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceTrust() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {evidenceTrust.map(([label, value, share, token]) => (
        <div
          className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel-soft)] p-4"
          key={String(label)}
        >
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--tge-concept-muted)]">
            {label}
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--tge-concept-ink)]">
            {value}
          </div>
          <div className="mt-4 h-3 bg-[var(--tge-concept-line)]">
            <div
              className="h-3"
              style={{
                backgroundColor: cssToken(String(token)),
                width: `${share}%`,
              }}
            />
          </div>
        </div>
      ))}
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
          Dashboard V2 - global geothermal market command center
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-concept-muted)]">
          Iteration 2 pushes the dashboard toward market movement, visual
          intelligence, regional momentum, spatial intensity, and source-backed
          confidence. It remains a concept page and does not change live workflows.
        </p>
      </section>

      <Shell>
        <main className="space-y-5 p-4 md:p-6">
          <section className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-concept-green)]">
                Market Pulse
              </div>
              <h2 className="mt-2 max-w-4xl text-4xl font-bold tracking-tight text-[var(--tge-concept-ink)]">
                What changed in geothermal this week?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--tge-concept-muted)]">
                Open with market movement: capacity change, new signals, active
                markets, and confidence. Platform structure stays underneath.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </div>
            </div>

            <div className="border border-[var(--tge-concept-line)] bg-[var(--tge-concept-panel)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[var(--tge-concept-ink)]">
                    Signal Pulse
                  </div>
                  <div className="mt-1 text-xs text-[var(--tge-concept-muted)]">
                    Financing, drilling, commissioning, policy, and company movement.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--tge-concept-ink)]">
                    42
                  </div>
                  <div className="text-xs text-[var(--tge-concept-muted)]">
                    new signals
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <SignalPulse />
              </div>
            </div>
          </section>

          <Section
            description="Charts should become the intelligence surface, not decoration. This block tests trend, growth, and outlook patterns."
            eyebrow="Trend Surface"
            title="Capacity movement and outlook"
          >
            <CapacityTrendSurface />
          </Section>

          <section className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
            <Section
              description="Capacity-first development structure, with project count as supporting context."
              eyebrow="Pipeline"
              title="Global development pipeline by phase"
            >
              <PipelineStack />
            </Section>

            <Section
              description="A living market feed should bridge dashboard, source evidence, and market drilldowns."
              eyebrow="Market Signals"
              title="Signals changing the market view"
            >
              <IntelligenceFeed />
            </Section>
          </section>

          <Section
            description="Regional comparison should communicate operating strength, pipeline pressure, and market momentum before country-level drilldown."
            eyebrow="Regional Momentum"
            title="Where activity is strongest and moving"
          >
            <RegionalMomentum />
          </Section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Section
              description="Country rankings should feel like market discovery, not a country administration table."
              eyebrow="Country Movers"
              title="Markets to investigate next"
            >
              <CountryMovers />
            </Section>

            <Section
              description="The map preview should behave as spatial market intelligence, with clusters and intensity as the visual language."
              eyebrow="Spatial Intelligence"
              title="Geothermal activity intensity"
            >
              <MapPreview />
            </Section>
          </section>

          <Section
            description="Trust context remains available, but it does not lead the executive dashboard."
            eyebrow="Evidence Confidence"
            title="Why the intelligence is credible"
          >
            <EvidenceTrust />
          </Section>
        </main>
      </Shell>
    </main>
  );
}
