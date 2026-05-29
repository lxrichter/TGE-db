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
