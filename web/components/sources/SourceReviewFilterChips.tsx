import Link from "next/link";

export type SourceReviewFilterChip = {
  key: string;
  label: string;
  value: string;
  href: string;
};

export default function SourceReviewFilterChips({
  chips,
  resetHref,
  emptyLabel = "All review candidates",
}: {
  chips: SourceReviewFilterChip[];
  resetHref: string;
  emptyLabel?: string;
}) {
  return (
    <div className="border-t border-gray-200 pt-4">
      {chips.length > 0 ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <span className="inline-flex min-h-8 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Active filters
            </span>
            {chips.map((chip) => (
              <Link
                className="inline-flex min-h-8 items-center justify-center border border-[#d7e8bf] bg-[#f5faef] px-3 text-xs font-semibold text-[#4f7f1f] hover:border-[#8dc63f] sm:justify-start"
                href={chip.href}
                key={chip.key}
              >
                <span className="text-gray-500">{chip.label}:</span>
                <span className="ml-1">{chip.value}</span>
                <span className="ml-2 text-gray-400">x</span>
              </Link>
            ))}
          </div>
          <Link
            className="inline-flex h-8 w-full items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] lg:w-auto"
            href={resetHref}
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
