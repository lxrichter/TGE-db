export type PostgresHierarchyTone = "core" | "workflow" | "governance";

function hierarchyToneClasses(tone: PostgresHierarchyTone) {
  if (tone === "core") {
    return {
      border: "border-[var(--tge-brand-green)]",
      eyebrow: "text-[var(--tge-brand-green-dark)]",
    };
  }

  if (tone === "workflow") {
    return {
      border: "border-[var(--tge-governance-info-border)]",
      eyebrow: "text-[var(--tge-governance-info-text)]",
    };
  }

  return {
    border: "border-[var(--tge-governance-neutral-border)]",
    eyebrow: "text-[var(--tge-governance-neutral-text)]",
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
      className={`border-t ${classes.border} bg-transparent px-0 py-2`}
    >
      <div className="min-w-0">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline">
          <div
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] ${classes.eyebrow}`}
          >
            {label}
          </div>
          <h2 className="text-base font-bold text-[var(--tge-text-primary)]">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-1 max-w-5xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
