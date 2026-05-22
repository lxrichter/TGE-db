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
      <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="border border-gray-200 bg-[#f7f7f7] px-4 py-4 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#4f7f1f]">
              {action.label}
            </div>
            <h3 className="mt-2 text-sm font-bold leading-5 text-[#1f2937]">
              {action.title}
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
