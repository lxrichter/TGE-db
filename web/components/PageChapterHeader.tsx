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
      <div className="px-6 py-5 xl:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green)]">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--tge-text-primary)] xl:text-[2.1rem]">
          {title}
        </h1>

        {description ? (
          <p className="mt-3 max-w-5xl text-sm leading-6 text-[var(--tge-text-secondary)] xl:text-base xl:leading-7">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
