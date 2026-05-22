export type PostgresHierarchyTone = "core" | "workflow" | "governance";

function hierarchyToneClasses(tone: PostgresHierarchyTone) {
  if (tone === "core") {
    return {
      border: "border-[#8dc63f]",
      eyebrow: "text-[#4f7f1f]",
      badge: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
      label: "Core",
    };
  }

  if (tone === "workflow") {
    return {
      border: "border-blue-300",
      eyebrow: "text-blue-700",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      label: "Workflow",
    };
  }

  return {
    border: "border-gray-300",
    eyebrow: "text-gray-600",
    badge: "border-gray-200 bg-[#f7f7f7] text-gray-700",
    label: "Governance",
  };
}

export default function PostgresHierarchyMarker({
  title,
  description,
  label,
  tone,
}: {
  title: string;
  description?: string;
  label: string;
  tone: PostgresHierarchyTone;
}) {
  const classes = hierarchyToneClasses(tone);

  return (
    <section
      className={`border-l-4 ${classes.border} bg-white px-5 py-2.5 shadow-[inset_0_-1px_0_#e5e7eb,inset_0_1px_0_#e5e7eb]`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div
            className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${classes.eyebrow}`}
          >
            {label}
          </div>
          <div className="mt-0.5 flex flex-col gap-1 lg:flex-row lg:items-baseline">
            <h2 className="text-sm font-bold text-[#1f2937]">{title}</h2>
            {description ? (
              <p className="max-w-4xl text-xs leading-5 text-gray-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={`inline-flex h-6 shrink-0 items-center border px-2 text-[10px] font-semibold uppercase tracking-wide ${classes.badge}`}
        >
          {classes.label}
        </span>
      </div>
    </section>
  );
}
