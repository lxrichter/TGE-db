type DetailHeaderProps = {
  typeLabel: string;
  title: string;
  country?: string | null;
  region?: string | null;
  location?: string | null;
  primaryBadge?: React.ReactNode;
  secondaryBadge?: React.ReactNode;
  children?: React.ReactNode;
};

export default function DetailHeader({
  typeLabel,
  title,
  country,
  region,
  location,
  primaryBadge,
  secondaryBadge,
  children,
}: DetailHeaderProps) {
  return (
    <section className="border border-gray-200 bg-white p-8">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8dc63f]">
          {typeLabel}
        </p>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>{country || "NA"}</span>
              <span className="text-gray-300">|</span>
              <span>{region || "NA"}</span>
              <span className="text-gray-300">|</span>
              <span>{location || "NA"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            {primaryBadge}
            {secondaryBadge}
          </div>
        </div>
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}