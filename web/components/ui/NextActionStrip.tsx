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
    <section className="border border-gray-200 bg-[#fbfbfb]">
      <div className="flex flex-col gap-1 px-4 py-2.5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#4f7f1f]">
            {title}
          </h2>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-gray-600">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-2 border-t border-gray-200 bg-white px-3 py-3 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="group border border-gray-200 bg-white px-3 py-2.5 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
          >
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {action.label}
              </div>
              <h3 className="text-sm font-bold leading-5 text-[#1f2937] group-hover:text-[#4f7f1f]">
                {action.title}
              </h3>
              <p className="text-xs leading-5 text-gray-600">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
