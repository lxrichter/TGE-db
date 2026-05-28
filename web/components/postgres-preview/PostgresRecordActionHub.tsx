import Link from "next/link";
import PostgresStatusBadge, {
  postgresStatusToneClass,
} from "@/components/postgres-preview/PostgresStatusBadge";
import { formatCount } from "@/lib/format";

export type PostgresRecordActionTone = "blocker" | "warning" | "ready" | "neutral";
export type PostgresRecordActionGroup =
  | "record"
  | "evidence"
  | "relationships"
  | "governance";

export type PostgresRecordAction = {
  label: string;
  detail: string;
  href: string;
  tone: PostgresRecordActionTone;
  primary?: boolean;
  group?: PostgresRecordActionGroup;
};

const actionToneClasses: Record<PostgresRecordActionTone, string> = {
  blocker: postgresStatusToneClass("danger"),
  warning: postgresStatusToneClass("attention"),
  ready: postgresStatusToneClass("success"),
  neutral: postgresStatusToneClass("neutral"),
};

const actionGroupOrder: PostgresRecordActionGroup[] = [
  "record",
  "evidence",
  "relationships",
  "governance",
];

const actionGroupMeta: Record<
  PostgresRecordActionGroup,
  { eyebrow: string; title: string; description: string }
> = {
  record: {
    eyebrow: "Core",
    title: "Core Data",
    description: "Fix the primary structured fields that define this profile.",
  },
  evidence: {
    eyebrow: "Evidence",
    title: "Sources & Evidence",
    description: "Add or review source-backed evidence.",
  },
  relationships: {
    eyebrow: "Workflow",
    title: "Relationships",
    description: "Manage linked companies, projects, plants, and roles.",
  },
  governance: {
    eyebrow: "Governance",
    title: "Review & Readiness",
    description: "Resolve AI review, Research Ops issues, and export checks.",
  },
};

function actionLinkClass(action: PostgresRecordAction) {
  const base =
    "block border px-3 py-3 text-left transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]";

  return `${base} ${actionToneClasses[action.tone]} ${
    action.primary ? "ring-2 ring-[var(--tge-governance-success-border)]" : ""
  }`;
}

export function PostgresNextRequiredActionStrip({
  action,
  modeLabel = "Research mode",
}: {
  action: PostgresRecordAction;
  modeLabel?: string;
}) {
  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="grid gap-4 px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            Next Required Action
          </div>
          <div className="mt-1 text-sm font-bold text-[var(--tge-text-primary)]">{modeLabel}</div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PostgresStatusBadge value={action.tone} />
            <h2 className="text-base font-bold text-[var(--tge-text-primary)]">{action.label}</h2>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            {action.detail}
          </p>
        </div>
        <Link
          href={action.href}
          className="inline-flex min-h-9 w-full items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] sm:w-auto"
        >
          Open
        </Link>
      </div>
    </section>
  );
}

export default function PostgresRecordActionHub({
  title,
  description,
  actions,
  blockerCount,
  warningCount,
}: {
  title: string;
  description: string;
  actions: PostgresRecordAction[];
  blockerCount: number;
  warningCount: number;
}) {
  const groupedActions = actionGroupOrder
    .map((group) => ({
      group,
      actions: actions.filter((action) => (action.group || "record") === group),
    }))
    .filter((group) => group.actions.length > 0);

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            Operational Focus
          </div>
          <h2 className="mt-2 text-xl font-bold text-[var(--tge-text-primary)]">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <PostgresStatusBadge
            label={`${formatCount(blockerCount)} blockers`}
            tone={blockerCount > 0 ? "danger" : "success"}
            value={blockerCount > 0 ? "blocker" : "ready"}
          />
          <PostgresStatusBadge
            label={`${formatCount(warningCount)} warnings`}
            tone={warningCount > 0 ? "attention" : "success"}
            value={warningCount > 0 ? "warning" : "ready"}
          />
          <Link
            href="/postgres-preview/research-ops"
            className="inline-flex h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
          >
            Research Ops
          </Link>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {groupedActions.map(({ group, actions: groupActions }) => {
          const meta = actionGroupMeta[group];

          return (
            <section
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-3"
              key={group}
            >
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                    {meta.eyebrow}
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-[var(--tge-text-primary)]">
                    {meta.title}
                  </h3>
                </div>
                <p className="max-w-2xl text-xs leading-5 text-[var(--tge-text-secondary)]">
                  {meta.description}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {groupActions.map((action) => (
                  <Link
                    key={`${action.label}-${action.href}`}
                    className={actionLinkClass(action)}
                    href={action.href}
                  >
                    <div className="text-sm font-bold text-[var(--tge-text-primary)]">
                      {action.label}
                    </div>
                    <div className="mt-1.5 text-xs leading-5 text-[var(--tge-text-secondary)]">
                      {action.detail}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
