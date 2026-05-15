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
    <section className="border border-gray-200 bg-white">
      <div className="border-l-[8px] border-[#8dc63f] px-8 py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8dc63f]">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f2937]">
          {title}
        </h1>

        {description ? (
          <p className="mt-3 max-w-4xl text-base leading-7 text-gray-600">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}