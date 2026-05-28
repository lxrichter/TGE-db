type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function DetailSection({
  title,
  children,
}: DetailSectionProps) {
  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-6 py-4">
        <h2 className="text-xl font-bold text-[var(--tge-text-primary)]">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
