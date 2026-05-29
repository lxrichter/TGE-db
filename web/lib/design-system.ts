export type TgeSemanticTone =
  | "neutral"
  | "brand"
  | "operating"
  | "pipeline"
  | "prospect"
  | "exploration"
  | "pre_feasibility"
  | "feasibility"
  | "construction"
  | "review"
  | "danger"
  | "governance"
  | "evidence"
  | "ai";

export type TgeKpiSize = "large" | "medium" | "small";
export type TgeTableDensity = "comfortable" | "compact" | "dense";

export const tgeTypography = {
  pageLabel:
    "text-[11px] font-bold uppercase leading-4 tracking-[0.12em]",
  pageTitle:
    "text-2xl font-bold leading-8 tracking-tight md:text-[1.75rem] md:leading-9",
  intelligenceHeadline:
    "text-4xl font-bold leading-[1.06] tracking-tight md:text-[2.65rem]",
  sectionTitle: "text-xl font-bold leading-7 tracking-tight md:text-[1.25rem]",
  subsectionTitle: "text-[15px] font-bold leading-6",
  body: "text-sm font-normal leading-6",
  bodyStrong: "text-sm font-semibold leading-6",
  metadata:
    "text-xs font-medium leading-5 text-[var(--tge-governance-muted-text)]",
  tableHeader:
    "text-[11px] font-bold uppercase leading-4 tracking-wide",
  tableBody: "text-sm font-medium leading-5",
  badge: "text-[10px] font-bold uppercase leading-4 tracking-wide",
} as const;

export const tgeSpacing = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
  "2xl": "gap-8",
  cardCompact: "p-3",
  card: "p-4",
  cardLarge: "p-5 md:p-6",
  section: "space-y-4",
  page: "space-y-7 sm:space-y-8",
} as const;

export const tgeSurfaces = {
  page: "bg-[var(--tge-surface-page)]",
  section: "bg-transparent",
  card:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  cardSubtle:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  panel: "bg-[var(--tge-surface-card)]",
  panelSubtle: "bg-[var(--tge-surface-subtle)]",
  header:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  tableHeader: "bg-[var(--tge-governance-neutral-bg)]",
  hover:
    "transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]",
  shadow: "shadow-sm",
} as const;

export const tgeBrandIdentity = {
  primaryAction:
    "border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] text-[var(--tge-surface-card)]",
  secondaryAction:
    "border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] text-[var(--tge-brand-green-dark)]",
  navActive:
    "bg-[var(--tge-brand-green)] text-[var(--tge-brand-dark)]",
  text: "text-[var(--tge-brand-green-dark)]",
  accent: "border-l-[var(--tge-brand-green)]",
  bar: "bg-[var(--tge-brand-green)]",
} as const;

export const tgeText = {
  primary: "text-[var(--tge-text-primary)]",
  secondary: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  brand: "text-[var(--tge-brand-green-dark)]",
  inverse: "text-[var(--tge-surface-card)]",
} as const;

export const tgeToneClasses: Record<
  TgeSemanticTone,
  {
    accent: string;
    border: string;
    surface: string;
    text: string;
    bar: string;
  }
> = {
  neutral: {
    accent: "border-l-[var(--tge-governance-neutral-border)]",
    border: "border-[var(--tge-governance-neutral-border)]",
    surface: "bg-[var(--tge-surface-card)]",
    text: "text-[var(--tge-governance-neutral-text)]",
    bar: "bg-[var(--tge-status-bar-neutral)]",
  },
  brand: {
    accent: "border-l-[var(--tge-brand-green)]",
    border: "border-[var(--tge-brand-green)]",
    surface: "bg-[var(--tge-governance-success-bg)]",
    text: "text-[var(--tge-brand-green-dark)]",
    bar: "bg-[var(--tge-brand-green)]",
  },
  operating: {
    accent: "border-l-[var(--tge-status-bar-operating)]",
    border: "border-[var(--tge-lifecycle-operating-border)]",
    surface: "bg-[var(--tge-lifecycle-operating-bg)]",
    text: "text-[var(--tge-lifecycle-operating-text)]",
    bar: "bg-[var(--tge-status-bar-operating)]",
  },
  pipeline: {
    accent: "border-l-[var(--tge-governance-info-text)]",
    border: "border-[var(--tge-governance-info-border)]",
    surface: "bg-[var(--tge-governance-info-bg)]",
    text: "text-[var(--tge-governance-info-text)]",
    bar: "bg-[var(--tge-status-bar-info)]",
  },
  prospect: {
    accent: "border-l-[var(--tge-lifecycle-prospect-border)]",
    border: "border-[var(--tge-lifecycle-prospect-border)]",
    surface: "bg-[var(--tge-lifecycle-prospect-bg)]",
    text: "text-[var(--tge-lifecycle-prospect-text)]",
    bar: "bg-[var(--tge-status-bar-muted)]",
  },
  exploration: {
    accent: "border-l-[var(--tge-lifecycle-exploration-border)]",
    border: "border-[var(--tge-lifecycle-exploration-border)]",
    surface: "bg-[var(--tge-lifecycle-exploration-bg)]",
    text: "text-[var(--tge-lifecycle-exploration-text)]",
    bar: "bg-[var(--tge-status-bar-info)]",
  },
  pre_feasibility: {
    accent: "border-l-[var(--tge-lifecycle-pre-feasibility-border)]",
    border: "border-[var(--tge-lifecycle-pre-feasibility-border)]",
    surface: "bg-[var(--tge-lifecycle-pre-feasibility-bg)]",
    text: "text-[var(--tge-lifecycle-pre-feasibility-text)]",
    bar: "bg-[var(--tge-status-bar-pre-feasibility)]",
  },
  feasibility: {
    accent: "border-l-[var(--tge-lifecycle-feasibility-border)]",
    border: "border-[var(--tge-lifecycle-feasibility-border)]",
    surface: "bg-[var(--tge-lifecycle-feasibility-bg)]",
    text: "text-[var(--tge-lifecycle-feasibility-text)]",
    bar: "bg-[var(--tge-status-bar-feasibility)]",
  },
  construction: {
    accent: "border-l-[var(--tge-lifecycle-construction-border)]",
    border: "border-[var(--tge-lifecycle-construction-border)]",
    surface: "bg-[var(--tge-lifecycle-construction-bg)]",
    text: "text-[var(--tge-lifecycle-construction-text)]",
    bar: "bg-[var(--tge-status-bar-attention)]",
  },
  review: {
    accent: "border-l-[var(--tge-governance-attention-text)]",
    border: "border-[var(--tge-governance-attention-border)]",
    surface: "bg-[var(--tge-governance-attention-bg)]",
    text: "text-[var(--tge-governance-attention-text)]",
    bar: "bg-[var(--tge-status-bar-attention)]",
  },
  danger: {
    accent: "border-l-[var(--tge-governance-danger-text)]",
    border: "border-[var(--tge-governance-danger-border)]",
    surface: "bg-[var(--tge-governance-danger-bg)]",
    text: "text-[var(--tge-governance-danger-text)]",
    bar: "bg-[var(--tge-status-bar-danger)]",
  },
  governance: {
    accent: "border-l-[var(--tge-governance-neutral-text)]",
    border: "border-[var(--tge-governance-neutral-border)]",
    surface: "bg-[var(--tge-governance-neutral-bg)]",
    text: "text-[var(--tge-governance-neutral-text)]",
    bar: "bg-[var(--tge-status-bar-neutral)]",
  },
  evidence: {
    accent: "border-l-[var(--tge-brand-green-dark)]",
    border: "border-[var(--tge-governance-success-border)]",
    surface: "bg-[var(--tge-governance-success-bg)]",
    text: "text-[var(--tge-governance-success-text)]",
    bar: "bg-[var(--tge-status-bar-success)]",
  },
  ai: {
    accent: "border-l-[var(--tge-ai-suggested-text)]",
    border: "border-[var(--tge-ai-suggested-border)]",
    surface: "bg-[var(--tge-ai-suggested-bg)]",
    text: "text-[var(--tge-ai-suggested-text)]",
    bar: "bg-[var(--tge-ai-suggested-text)]",
  },
};

export const tgeKpiSizeClasses: Record<
  TgeKpiSize,
  { frame: string; value: string; label: string; context: string }
> = {
  large: {
    frame: "border-l-2 px-4 py-3.5 md:px-5",
    value: "mt-2 text-3xl font-bold leading-none tracking-tight",
    label: tgeTypography.tableHeader,
    context: "mt-2 text-xs leading-5",
  },
  medium: {
    frame: "border-l-2 px-4 py-3",
    value: "mt-2 text-2xl font-bold leading-none tracking-tight",
    label: tgeTypography.tableHeader,
    context: "mt-2 text-xs leading-5",
  },
  small: {
    frame: "border-l-2 px-3 py-2.5",
    value: "mt-1 text-xl font-bold leading-none tracking-tight",
    label: "text-[10px] font-bold uppercase leading-4 tracking-wide",
    context: "mt-1 text-xs leading-5",
  },
};

export const tgeTableDensityClasses: Record<
  TgeTableDensity,
  { header: string; row: string; cell: string }
> = {
  comfortable: {
    header: "px-4 py-3",
    row: "min-h-14",
    cell: "px-4 py-3",
  },
  compact: {
    header: "px-4 py-2.5",
    row: "min-h-12",
    cell: "px-4 py-2.5",
  },
  dense: {
    header: "px-3 py-2",
    row: "min-h-10",
    cell: "px-3 py-2",
  },
};

export const tgeLifecycleOrder = [
  "Prospect / TBD",
  "Exploration",
  "Pre-Feasibility",
  "Feasibility",
  "Construction",
  "Operating",
  "Cancelled / Suspended",
] as const;

export type TgeChartPaletteEntry = {
  key: string;
  label: string;
  cssVar: string;
  hex: string;
  usage: string;
};

export const tgeChartLanguageV2 = {
  principle:
    "Color communicates meaning, not decoration. The same metric uses the same color everywhere.",
  ranking: [
    {
      key: "installed_capacity",
      label: "Installed Capacity",
      cssVar: "var(--tge-chart-ranking-installed-capacity)",
      hex: "#2f5f2b",
      usage: "Operating MWe / installed capacity ranking bars.",
    },
    {
      key: "pipeline_capacity",
      label: "Pipeline Capacity",
      cssVar: "var(--tge-chart-ranking-pipeline-capacity)",
      hex: "#2c6f9f",
      usage: "Pipeline MWe and development capacity ranking bars.",
    },
    {
      key: "market_count",
      label: "Market / Record Count",
      cssVar: "var(--tge-chart-ranking-market-count)",
      hex: "#6f7d81",
      usage: "Counts, profiles, markets, and neutral ranking metrics.",
    },
    {
      key: "attributed_mw",
      label: "Attributed MW",
      cssVar: "var(--tge-chart-ranking-attributed-mw)",
      hex: "#178b82",
      usage: "Developer, operator, owner, and supplier attributed-MW rankings.",
    },
  ] satisfies TgeChartPaletteEntry[],
  lifecycle: [
    {
      key: "prospect",
      label: "Prospect / TBD",
      cssVar: "var(--tge-chart-lifecycle-prospect)",
      hex: "#d9e0dc",
      usage: "Earliest or unresolved project stage.",
    },
    {
      key: "exploration",
      label: "Exploration",
      cssVar: "var(--tge-chart-lifecycle-exploration)",
      hex: "#b9d98b",
      usage: "Early development and resource exploration.",
    },
    {
      key: "pre_feasibility",
      label: "Pre-Feasibility",
      cssVar: "var(--tge-chart-lifecycle-pre-feasibility)",
      hex: "#8dc63f",
      usage: "Initial commercial and technical assessment.",
    },
    {
      key: "feasibility",
      label: "Feasibility",
      cssVar: "var(--tge-chart-lifecycle-feasibility)",
      hex: "#4f8f2f",
      usage: "Advanced project maturity before construction.",
    },
    {
      key: "construction",
      label: "Construction",
      cssVar: "var(--tge-chart-lifecycle-construction)",
      hex: "#c98932",
      usage: "Build activity, drilling, commissioning, or near-term movement.",
    },
    {
      key: "operating",
      label: "Operating",
      cssVar: "var(--tge-chart-lifecycle-operating)",
      hex: "#2f5f2b",
      usage: "Operating or moved from pipeline into installed capacity.",
    },
    {
      key: "cancelled",
      label: "Cancelled / Suspended",
      cssVar: "var(--tge-chart-lifecycle-cancelled)",
      hex: "#b94a48",
      usage: "Cancelled, suspended, retired from project pipeline, or invalidated.",
    },
  ] satisfies TgeChartPaletteEntry[],
  governance: [
    {
      key: "approved",
      label: "Approved",
      cssVar: "var(--tge-chart-governance-approved)",
      hex: "#5f8f2f",
      usage: "Approved or validated review state only.",
    },
    {
      key: "needs_review",
      label: "Needs Review",
      cssVar: "var(--tge-chart-governance-needs-review)",
      hex: "#d99a32",
      usage: "Human review needed, pending decision, or unresolved issue.",
    },
    {
      key: "rejected",
      label: "Rejected",
      cssVar: "var(--tge-chart-governance-rejected)",
      hex: "#c44d4d",
      usage: "Rejected candidate, invalid evidence, or denied proposal.",
    },
    {
      key: "blocked",
      label: "Blocked",
      cssVar: "var(--tge-chart-governance-blocked)",
      hex: "#7f1d1d",
      usage: "Blocking governance issue or critical validation failure.",
    },
    {
      key: "ai_candidate",
      label: "AI Candidate",
      cssVar: "var(--tge-chart-governance-ai-candidate)",
      hex: "#7667a8",
      usage: "Candidate generated by AI and awaiting human judgement.",
    },
    {
      key: "ai_suggested",
      label: "AI Suggested",
      cssVar: "var(--tge-chart-governance-ai-suggested)",
      hex: "#d9d2f0",
      usage: "Low-weight AI suggestion, helper, or proposed enrichment.",
    },
  ] satisfies TgeChartPaletteEntry[],
  technology: [
    {
      key: "back_pressure",
      label: "Back Pressure",
      cssVar: "var(--tge-chart-tech-back-pressure)",
      hex: "#1f4e79",
      usage: "Back-pressure turbine technology.",
    },
    {
      key: "single_flash",
      label: "Single Flash",
      cssVar: "var(--tge-chart-tech-single-flash)",
      hex: "#6fa536",
      usage: "Single-flash power plant technology.",
    },
    {
      key: "double_flash",
      label: "Double Flash",
      cssVar: "var(--tge-chart-tech-double-flash)",
      hex: "#8dc63f",
      usage: "Double-flash power plant technology.",
    },
    {
      key: "triple_flash",
      label: "Triple Flash",
      cssVar: "var(--tge-chart-tech-triple-flash)",
      hex: "#2f5f2b",
      usage: "Triple-flash power plant technology.",
    },
    {
      key: "dry_steam",
      label: "Dry Steam",
      cssVar: "var(--tge-chart-tech-dry-steam)",
      hex: "#c6dfb8",
      usage: "Dry-steam geothermal plants.",
    },
    {
      key: "binary_orc",
      label: "Binary ORC",
      cssVar: "var(--tge-chart-tech-binary-orc)",
      hex: "#178b82",
      usage: "Binary ORC plants and units.",
    },
    {
      key: "kalina",
      label: "Kalina",
      cssVar: "var(--tge-chart-tech-kalina)",
      hex: "#2aa7a0",
      usage: "Kalina cycle technology.",
    },
    {
      key: "combined_cycle",
      label: "Combined Cycle",
      cssVar: "var(--tge-chart-tech-combined-cycle)",
      hex: "#2c6f6b",
      usage: "Combined-cycle geothermal configurations.",
    },
    {
      key: "egs",
      label: "EGS",
      cssVar: "var(--tge-chart-tech-egs)",
      hex: "#c36f35",
      usage: "Enhanced geothermal systems.",
    },
    {
      key: "ags_closed_loop",
      label: "AGS / Closed Loop",
      cssVar: "var(--tge-chart-tech-ags-closed-loop)",
      hex: "#9a552e",
      usage: "Advanced geothermal systems and closed-loop technologies.",
    },
    {
      key: "direct_use",
      label: "Direct Use",
      cssVar: "var(--tge-chart-tech-direct-use)",
      hex: "#7667a8",
      usage: "Direct-use geothermal applications.",
    },
    {
      key: "district_heating",
      label: "District Heating",
      cssVar: "var(--tge-chart-tech-district-heating)",
      hex: "#8a72c0",
      usage: "District heating systems.",
    },
    {
      key: "heat_pumps",
      label: "Heat Pumps",
      cssVar: "var(--tge-chart-tech-heat-pumps)",
      hex: "#d9d2f0",
      usage: "Geothermal heat pump categories.",
    },
    {
      key: "lithium_coproduction",
      label: "Lithium / Co-Production",
      cssVar: "var(--tge-chart-tech-lithium-coproduction)",
      hex: "#b9862b",
      usage: "Lithium, minerals, and co-production categories.",
    },
    {
      key: "other",
      label: "Other",
      cssVar: "var(--tge-chart-tech-other)",
      hex: "#8a8f8d",
      usage: "Unknown, mixed, or uncategorized technology.",
    },
  ] satisfies TgeChartPaletteEntry[],
  signal: [
    {
      key: "drilling",
      label: "Drilling",
      cssVar: "var(--tge-chart-signal-drilling)",
      hex: "#c98932",
      usage: "Drilling campaigns, well testing, and subsurface activity.",
    },
    {
      key: "funding",
      label: "Funding",
      cssVar: "var(--tge-chart-signal-funding)",
      hex: "#5f8f2f",
      usage: "Financing, grants, funding rounds, and investment events.",
    },
    {
      key: "permits",
      label: "Permits",
      cssVar: "var(--tge-chart-signal-permits)",
      hex: "#2c6f9f",
      usage: "Permits, concessions, licenses, and regulatory approvals.",
    },
    {
      key: "policy",
      label: "Policy",
      cssVar: "var(--tge-chart-signal-policy)",
      hex: "#7667a8",
      usage: "Policy, tenders, incentives, and regulatory market changes.",
    },
    {
      key: "commissioning",
      label: "Commissioning",
      cssVar: "var(--tge-chart-signal-commissioning)",
      hex: "#178b82",
      usage: "COD, commissioning, plant startup, and operating transition.",
    },
    {
      key: "ma",
      label: "M&A",
      cssVar: "var(--tge-chart-signal-ma)",
      hex: "#b9862b",
      usage: "Acquisitions, divestments, portfolio movement, and corporate activity.",
    },
  ] satisfies TgeChartPaletteEntry[],
  spatial: [
    {
      key: "low",
      label: "Low Intensity",
      cssVar: "var(--tge-chart-spatial-low)",
      hex: "#dceccf",
      usage: "Low activity density or low market concentration.",
    },
    {
      key: "medium",
      label: "Medium Intensity",
      cssVar: "var(--tge-chart-spatial-medium)",
      hex: "#8dc63f",
      usage: "Medium activity density or capacity concentration.",
    },
    {
      key: "high",
      label: "High Intensity",
      cssVar: "var(--tge-chart-spatial-high)",
      hex: "#3f6f19",
      usage: "High activity density or major geothermal cluster.",
    },
    {
      key: "hotspot",
      label: "Hotspot / Signal",
      cssVar: "var(--tge-chart-spatial-hotspot)",
      hex: "#c98932",
      usage: "Recent market movement or activity hotspot overlay.",
    },
  ] satisfies TgeChartPaletteEntry[],
} as const;

export const tgeChartTaxonomy = [
  {
    key: "ranking",
    label: "A. Ranking Charts",
    rule: "Single metric = single color. Do not rainbow-code rows that represent the same metric.",
    examples: "Countries, companies, developers, operators, owners, technologies.",
  },
  {
    key: "lifecycle",
    label: "B. Lifecycle Charts",
    rule: "Use the lifecycle progression palette in fixed project-stage order.",
    examples: "Project pipeline, regional development stages, pipeline comparison.",
  },
  {
    key: "composition",
    label: "C. Composition Charts",
    rule: "Use the relevant category palette, such as technology, region, or source type.",
    examples: "Technology mix, capacity split, regional share, market share.",
  },
  {
    key: "signal",
    label: "D. Signal Charts",
    rule: "Use the signal palette for market events and activity categories.",
    examples: "Drilling, funding, permits, policy, commissioning, M&A.",
  },
  {
    key: "spatial",
    label: "E. Spatial Intelligence",
    rule: "Use intensity, density, and cluster visualization instead of random category color.",
    examples: "Map overlays, capacity density, activity clusters, regional hotspots.",
  },
] as const;
