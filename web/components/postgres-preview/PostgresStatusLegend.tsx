import PostgresStatusBadge, {
  type PostgresStatusDomain,
} from "@/components/postgres-preview/PostgresStatusBadge";

export type PostgresStatusLegendGroupKey =
  | "review"
  | "lifecycle"
  | "severity"
  | "source"
  | "visibility"
  | "confidence";

type LegendItem = {
  value: string;
  label?: string;
  note: string;
  domain: PostgresStatusDomain;
};

const legendGroups: Record<
  PostgresStatusLegendGroupKey,
  {
    title: string;
    description: string;
    items: LegendItem[];
  }
> = {
  review: {
    title: "Review Workflow",
    description: "Human validation state. Green means usable, amber means review needed, blue means active workflow, gray means draft/inactive.",
    items: [
      { value: "draft", note: "Can be incomplete", domain: "review" },
      { value: "validation", note: "Ready for review work", domain: "review" },
      { value: "needs_review", note: "Requires human review", domain: "review" },
      { value: "needs_update", note: "Approved record changed or stale", domain: "review" },
      { value: "approved", note: "Internally validated", domain: "review" },
      { value: "export_ready", note: "Suitable for formal outputs", domain: "review" },
    ],
  },
  lifecycle: {
    title: "Development Phase",
    description: "Project or plant progression. These badges describe market/lifecycle state, not evidence quality.",
    items: [
      {
        value: "prospect_tbd",
        label: "Prospect",
        note: "Early or not fully classified",
        domain: "lifecycle",
      },
      {
        value: "exploration",
        label: "Exploration / Feasibility",
        note: "Active development workflow",
        domain: "lifecycle",
      },
      { value: "construction", note: "Advanced, still not operating", domain: "lifecycle" },
      { value: "operating", note: "Commissioned plant state", domain: "lifecycle" },
      {
        value: "temporarily_offline",
        label: "Temporarily Offline",
        note: "Known plant operating issue",
        domain: "lifecycle",
      },
      {
        value: "retired_decommissioned",
        label: "Retired / Decommissioned",
        note: "Historical or inactive plant",
        domain: "lifecycle",
      },
      { value: "cancelled", note: "Historical or discontinued", domain: "lifecycle" },
    ],
  },
  severity: {
    title: "Issue Severity",
    description: "Operational priority. Red blocks review/export, amber needs quality work, blue is workflow routing, gray is advisory.",
    items: [
      { value: "critical", note: "Blocks review/export readiness", domain: "severity" },
      { value: "important", note: "Should be resolved for quality", domain: "severity" },
      { value: "workflow", note: "Needs human handling", domain: "severity" },
      { value: "useful", note: "Helpful but not blocking", domain: "severity" },
    ],
  },
  source: {
    title: "Source Credibility",
    description: "Evidence quality. Green is trusted evidence, amber needs caution/review, red is not usable.",
    items: [
      { value: "credible", note: "Usable as trusted evidence", domain: "source" },
      { value: "needs_review", note: "Awaiting source review", domain: "source" },
      { value: "outdated", note: "May need newer confirmation", domain: "source" },
      { value: "weak", note: "Low evidence strength", domain: "source" },
      { value: "rejected", note: "Not usable evidence", domain: "source" },
    ],
  },
  visibility: {
    title: "Visibility",
    description: "Publication and access scope. Restricted/confidential states should never leak into normal exports.",
    items: [
      { value: "public", note: "Public source or output-safe", domain: "visibility" },
      { value: "internal_only", note: "Internal research use", domain: "visibility" },
      {
        value: "stakeholder_confirmation",
        note: "Human confirmation, handle carefully",
        domain: "visibility",
      },
      {
        value: "client_confidential",
        note: "Restricted from normal outputs",
        domain: "visibility",
      },
    ],
  },
  confidence: {
    title: "AI / Match Confidence",
    description: "Candidate strength and write state. Confirmation accepts a suggestion; apply is the audited database write.",
    items: [
      { value: "high", note: "Strong candidate", domain: "confidence" },
      { value: "medium", note: "Review carefully", domain: "confidence" },
      { value: "low", note: "Weak or ambiguous", domain: "confidence" },
      { value: "confirmed", note: "Human accepted", domain: "confidence" },
      { value: "apply_ready", label: "Ready To Apply", note: "Confirmed but not written", domain: "confidence" },
      { value: "applied_to_record", label: "Applied To Record", note: "Audited database update", domain: "confidence" },
    ],
  },
};

export default function PostgresStatusLegend({
  title = "Badge Meaning",
  description = "Badge colors use one shared operational language: green = usable or complete, blue = active workflow, amber = needs attention, red = blocker/rejected/restricted, gray = draft/historical/advisory.",
  groups = ["review", "severity", "lifecycle"],
  compact = false,
}: {
  title?: string;
  description?: string;
  groups?: PostgresStatusLegendGroupKey[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section className="border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Status Language
            </div>
            <h2 className="mt-1 text-base font-bold text-[#1f2937]">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>
          <div className="grid min-w-0 gap-3 lg:min-w-[540px]">
            {groups.map((groupKey) => {
              const group = legendGroups[groupKey];

              return (
                <div
                  key={groupKey}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <div className="min-w-[135px] text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.slice(0, 4).map((item) => (
                      <PostgresStatusBadge
                        key={`${item.domain}-${item.value}-${item.label || ""}`}
                        domain={item.domain}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Status Language
        </div>
        <h2 className="mt-1 text-lg font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
          {description}
        </p>
      </div>
      <div className="grid gap-3 px-5 py-4 lg:grid-cols-3">
        {groups.map((groupKey) => {
          const group = legendGroups[groupKey];

          return (
            <div key={groupKey} className="border border-gray-200 bg-[#fbfbfb] p-4">
              <div className="text-sm font-bold text-[#1f2937]">
                {group.title}
              </div>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {group.description}
              </p>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div
                    className="flex flex-col gap-1 border-t border-gray-100 pt-2 sm:flex-row sm:items-center sm:justify-between"
                    key={`${item.domain}-${item.value}-${item.label || ""}`}
                  >
                    <PostgresStatusBadge
                      domain={item.domain}
                      label={item.label}
                      value={item.value}
                    />
                    <span className="text-xs leading-5 text-gray-500 sm:max-w-[180px] sm:text-right">
                      {item.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
