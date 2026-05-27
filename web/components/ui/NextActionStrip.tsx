import Link from "next/link";

type NextAction = {
  label: string;
  title: string;
  description: string;
  href: string;
};

export default function NextActionStrip({
  title = "Next Actions",
  description,
  actions,
}: {
  title?: string;
  description: string;
  actions: NextAction[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="grid gap-2 p-3 lg:grid-cols-[minmax(190px,0.75fr)_1fr]">
        <div className="border-l-2 border-l-[#8dc63f] bg-[#fbfbfb] px-3 py-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#4f7f1f]">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-gray-600">
            {description}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className="group border border-gray-200 bg-white px-3 py-2 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
            >
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {action.label}
                </div>
                <h3 className="line-clamp-1 text-sm font-bold leading-5 text-[#1f2937] group-hover:text-[#4f7f1f]">
                  {action.title}
                </h3>
                <p className="line-clamp-2 text-xs leading-5 text-gray-600">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
