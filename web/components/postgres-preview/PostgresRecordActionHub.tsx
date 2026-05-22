import Link from "next/link";
import PostgresStatusBadge, {
  postgresStatusToneClass,
} from "@/components/postgres-preview/PostgresStatusBadge";
import { formatCount } from "@/lib/format";

export type PostgresRecordActionTone = "blocker" | "warning" | "ready" | "neutral";

export type PostgresRecordAction = {
  label: string;
  detail: string;
  href: string;
  tone: PostgresRecordActionTone;
  primary?: boolean;
};

const actionToneClasses: Record<PostgresRecordActionTone, string> = {
  blocker: postgresStatusToneClass("danger"),
  warning: postgresStatusToneClass("attention"),
  ready: postgresStatusToneClass("success"),
  neutral: postgresStatusToneClass("neutral"),
};

function actionLinkClass(action: PostgresRecordAction) {
  const base =
    "block border px-4 py-4 text-left transition hover:border-[#8dc63f] hover:bg-[#f3f8ec]";

  return `${base} ${actionToneClasses[action.tone]} ${
    action.primary ? "ring-2 ring-[#8dc63f]/20" : ""
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
    <section className="border border-gray-200 bg-white">
      <div className="grid gap-4 px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Next Required Action
          </div>
          <div className="mt-1 text-sm font-bold text-[#1f2937]">{modeLabel}</div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PostgresStatusBadge value={action.tone} />
            <h2 className="text-base font-bold text-[#1f2937]">{action.label}</h2>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
            {action.detail}
          </p>
        </div>
        <Link
          href={action.href}
          className="inline-flex min-h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
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
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Record Workbench
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            Research Ops
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={`${action.label}-${action.href}`}
            className={actionLinkClass(action)}
            href={action.href}
          >
            <div className="text-sm font-bold text-[#1f2937]">
              {action.label}
            </div>
            <div className="mt-2 text-xs leading-5 text-gray-600">
              {action.detail}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
