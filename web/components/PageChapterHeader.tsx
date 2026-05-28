type PageChapterHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function PageChapterHeader({
  eyebrow = "ThinkGeoEnergy",
  title,
  description,
}: PageChapterHeaderProps) {
  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-l-[8px] border-[var(--tge-brand-green)] px-8 py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--tge-brand-green)]">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
          {title}
        </h1>

        {description ? (
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--tge-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
