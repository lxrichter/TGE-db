import Link from "next/link";
import type { ReactNode } from "react";
import {
  tgeChartLanguageV2,
  tgeKpiSizeClasses,
  tgeSurfaces,
  tgeTableDensityClasses,
  tgeText,
  tgeToneClasses,
  tgeTypography,
  type TgeKpiSize,
  type TgeSemanticTone,
  type TgeTableDensity,
} from "@/lib/design-system";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  label,
  title,
  description,
  actions,
  variant = "standard",
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: "standard" | "brief";
}) {
  return (
    <section
      className={joinClasses(
        variant === "brief" ? tgeSurfaces.card : "",
        variant === "brief" ? "px-5 py-5 md:px-6" : ""
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-5xl">
          {label ? (
            <div className={joinClasses(tgeTypography.pageLabel, tgeText.brand)}>
              {label}
            </div>
          ) : null}
          <h1
            className={joinClasses(
              variant === "brief"
                ? tgeTypography.intelligenceHeadline
                : tgeTypography.pageTitle,
              tgeText.primary,
              label ? "mt-2" : ""
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={joinClasses("mt-2 max-w-4xl", tgeTypography.body, tgeText.secondary)}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeader({
  label,
  title,
  description,
  action,
}: {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        {label ? (
          <div className={joinClasses(tgeTypography.pageLabel, tgeText.muted)}>
            {label}
          </div>
        ) : null}
        <h2 className={joinClasses(tgeTypography.sectionTitle, tgeText.primary)}>
          {title}
        </h2>
        {description ? (
          <p className={joinClasses("mt-1 max-w-3xl", tgeTypography.body, tgeText.secondary)}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function KPIStat({
  label,
  value,
  unit,
  context,
  delta,
  tone = "neutral",
  size = "medium",
  href,
}: {
  label: string;
  value: string;
  unit?: string;
  context?: string;
  delta?: string;
  tone?: TgeSemanticTone;
  size?: TgeKpiSize;
  href?: string;
}) {
  const toneClasses = tgeToneClasses[tone];
  const sizeClasses = tgeKpiSizeClasses[size];
  const frameClass = joinClasses(
    tgeSurfaces.card,
    toneClasses.accent,
    sizeClasses.frame,
    href ? tgeSurfaces.hover : ""
  );
  const content = (
    <>
      <div className={joinClasses(sizeClasses.label, tgeText.muted)}>{label}</div>
      <div className={joinClasses("flex items-end gap-2", sizeClasses.value, tgeText.primary)}>
        <span>{value}</span>
        {unit ? (
          <span className="pb-0.5 text-xs font-bold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            {unit}
          </span>
        ) : null}
      </div>
      {delta || context ? (
        <div className={joinClasses(sizeClasses.context, tgeText.secondary)}>
          {delta ? (
            <span className={joinClasses("font-semibold", toneClasses.text)}>
              {delta}
            </span>
          ) : null}
          {delta && context ? <span> · </span> : null}
          {context ? <span>{context}</span> : null}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className={frameClass} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={frameClass}>{content}</div>;
}

export function KPIStrip({
  children,
  columns = "four",
}: {
  children: ReactNode;
  columns?: "three" | "four" | "six";
}) {
  const columnClass =
    columns === "six"
      ? "md:grid-cols-3 xl:grid-cols-6"
      : columns === "three"
        ? "md:grid-cols-3"
        : "md:grid-cols-2 xl:grid-cols-4";

  return <div className={joinClasses("grid gap-3", columnClass)}>{children}</div>;
}

export function IntelligenceCard({
  label,
  title,
  description,
  meta,
  tone = "neutral",
  href,
}: {
  label?: string;
  title: string;
  description?: string;
  meta?: string;
  tone?: TgeSemanticTone;
  href?: string;
}) {
  const toneClasses = tgeToneClasses[tone];
  const frameClass = joinClasses(
    tgeSurfaces.card,
    toneClasses.accent,
    "border-l-4 p-4",
    href ? tgeSurfaces.hover : ""
  );
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          {label ? (
            <div className={joinClasses(tgeTypography.tableHeader, tgeText.muted)}>
              {label}
            </div>
          ) : null}
          <h3 className={joinClasses("mt-1", tgeTypography.subsectionTitle, tgeText.primary)}>
            {title}
          </h3>
        </div>
        {meta ? (
          <span className={joinClasses("border px-2 py-1", tgeTypography.badge, toneClasses.border, toneClasses.text)}>
            {meta}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className={joinClasses("mt-3", tgeTypography.body, tgeText.secondary)}>
          {description}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className={frameClass} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={frameClass}>{content}</div>;
}

export function MarketSignalCard({
  category,
  market,
  title,
  impact,
  strength,
  tone = "pipeline",
}: {
  category: string;
  market: string;
  title: string;
  impact: string;
  strength: number;
  tone?: TgeSemanticTone;
}) {
  const toneClasses = tgeToneClasses[tone];
  return (
    <article className={joinClasses(tgeSurfaces.card, "grid gap-4 p-4 md:grid-cols-[128px_1fr_120px]")}>
      <div>
        <div className={joinClasses("inline-flex px-2 py-1", tgeTypography.badge, toneClasses.surface, toneClasses.text)}>
          {category}
        </div>
        <div className={joinClasses("mt-2", tgeTypography.bodyStrong, tgeText.primary)}>
          {market}
        </div>
      </div>
      <div>
        <h3 className={joinClasses(tgeTypography.subsectionTitle, tgeText.primary)}>
          {title}
        </h3>
        <p className={joinClasses("mt-1", tgeTypography.metadata)}>{impact}</p>
        <div className="mt-3 h-3 bg-[var(--tge-governance-neutral-bg)]">
          <div className={joinClasses("h-3", toneClasses.bar)} style={{ width: `${strength}%` }} />
        </div>
      </div>
      <div className="text-right">
        <div className={joinClasses("text-2xl font-bold", tgeText.primary)}>
          {strength}
        </div>
        <div className={joinClasses(tgeTypography.metadata)}>impact</div>
      </div>
    </article>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: TgeSemanticTone;
}) {
  const toneClasses = tgeToneClasses[tone];
  return (
    <span
      className={joinClasses(
        "inline-flex min-h-6 items-center border px-2",
        tgeTypography.badge,
        toneClasses.border,
        toneClasses.surface,
        toneClasses.text
      )}
    >
      {children}
    </span>
  );
}

export function LifecycleBadge({
  phase,
}: {
  phase:
    | "Prospect / TBD"
    | "Exploration"
    | "Pre-Feasibility"
    | "Feasibility"
    | "Construction"
    | "Operating"
    | "Cancelled";
}) {
  const lifecycleColor =
    tgeChartLanguageV2.lifecycle.find((entry) => entry.label === phase) ??
    tgeChartLanguageV2.lifecycle[0];
  const textColor =
    phase === "Prospect / TBD"
      ? "var(--tge-text-primary)"
      : "var(--tge-surface-card)";

  return (
    <span
      className={joinClasses(
        "inline-flex min-h-7 items-center px-2.5",
        tgeTypography.badge
      )}
      style={{
        backgroundColor: lifecycleColor.cssVar,
        color: textColor,
      }}
    >
      {phase}
    </span>
  );
}

export function FilterBar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={joinClasses(tgeSurfaces.cardSubtle, "flex flex-wrap items-center gap-2 p-3")}>
      {children}
    </div>
  );
}

export function ChartContainer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={joinClasses(tgeSurfaces.card, "p-4")}>
      <SectionHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

export type TgeTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type TgeTableRow = Record<string, ReactNode>;

function BaseTable({
  columns,
  rows,
  density = "compact",
  variant,
}: {
  columns: TgeTableColumn[];
  rows: TgeTableRow[];
  density?: TgeTableDensity;
  variant: "entity" | "governance" | "ranking";
}) {
  const densityClasses = tgeTableDensityClasses[density];
  const variantClass =
    variant === "ranking"
      ? "min-w-[720px]"
      : variant === "governance"
        ? "min-w-[860px]"
        : "min-w-[820px]";

  return (
    <div className={joinClasses(tgeSurfaces.card, "overflow-x-auto")}>
      <table className={joinClasses("w-full table-fixed text-left", variantClass)}>
        <thead className={joinClasses(tgeSurfaces.tableHeader, tgeTypography.tableHeader, tgeText.muted)}>
          <tr>
            {columns.map((column) => (
              <th
                className={joinClasses(
                  densityClasses.header,
                  column.align === "right" ? "text-right" : "text-left"
                )}
                key={column.key}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {rows.map((row, index) => (
            <tr className={joinClasses(densityClasses.row, tgeTypography.tableBody)} key={index}>
              {columns.map((column) => (
                <td
                  className={joinClasses(
                    densityClasses.cell,
                    column.align === "right" ? "text-right" : "text-left",
                    tgeText.secondary
                  )}
                  key={column.key}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EntityTable(props: {
  columns: TgeTableColumn[];
  rows: TgeTableRow[];
  density?: TgeTableDensity;
}) {
  return <BaseTable {...props} variant="entity" />;
}

export function GovernanceTable(props: {
  columns: TgeTableColumn[];
  rows: TgeTableRow[];
  density?: TgeTableDensity;
}) {
  return <BaseTable {...props} variant="governance" />;
}

export function RankingTable(props: {
  columns: TgeTableColumn[];
  rows: TgeTableRow[];
  density?: TgeTableDensity;
}) {
  return <BaseTable {...props} variant="ranking" />;
}
