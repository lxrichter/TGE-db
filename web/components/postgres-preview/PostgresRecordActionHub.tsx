import Link from "next/link";
import { StatusBadge } from "@/components/postgres-preview/PostgresEntityDetail";
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
  blocker: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  ready: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  neutral: "border-gray-200 bg-white text-gray-700",
};

function actionLinkClass(action: PostgresRecordAction) {
  const base =
    "block border px-4 py-4 text-left transition hover:border-[#8dc63f] hover:bg-[#f3f8ec]";

  return `${base} ${actionToneClasses[action.tone]} ${
    action.primary ? "ring-2 ring-[#8dc63f]/20" : ""
  }`;
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
          <StatusBadge value={`${formatCount(blockerCount)} blockers`} />
          <StatusBadge value={`${formatCount(warningCount)} warnings`} />
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
