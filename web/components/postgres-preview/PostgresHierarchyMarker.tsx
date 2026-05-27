export type PostgresHierarchyTone = "core" | "workflow" | "governance";

function hierarchyToneClasses(tone: PostgresHierarchyTone) {
  if (tone === "core") {
    return {
      border: "border-[#8dc63f]",
      eyebrow: "text-[#4f7f1f]",
    };
  }

  if (tone === "workflow") {
    return {
      border: "border-blue-300",
      eyebrow: "text-blue-700",
    };
  }

  return {
    border: "border-gray-300",
    eyebrow: "text-gray-600",
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
      className={`border-l-2 ${classes.border} bg-transparent px-3 py-1.5`}
    >
      <div className="min-w-0">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline">
          <div
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] ${classes.eyebrow}`}
          >
            {label}
          </div>
          <h2 className="text-sm font-bold text-[#1f2937]">{title}</h2>
        </div>
        {description ? (
          <p className="mt-0.5 max-w-4xl text-xs leading-5 text-gray-500">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
