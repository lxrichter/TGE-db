export type PostgresSectionJumpNavItem = {
  label: string;
  href: string;
  note?: string;
};

export default function PostgresSectionJumpNav({
  items,
}: {
  items: PostgresSectionJumpNavItem[];
}) {
  return (
    <nav
      aria-label="Page sections"
      className="border border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:z-20"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Page Sections
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Jump between the main operational layers on this page.
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
          {items.map((item) => (
            <a
              key={item.href}
              className="inline-flex min-h-9 shrink-0 flex-col justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={item.href}
            >
              <span>{item.label}</span>
              {item.note ? (
                <span className="mt-0.5 font-normal text-gray-500">
                  {item.note}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
