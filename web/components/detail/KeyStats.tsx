type StatItem = {
  label: string;
  value: string | number | null | undefined;
};

export default function KeyStats({ items }: { items: StatItem[] }) {
  const filtered = items.filter((item) => {
    if (item.value === null || item.value === undefined) return false;

    const text = String(item.value).trim();
    return text !== "" && text.toLowerCase() !== "na";
  });

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {filtered.map((item) => (
        <div key={item.label} className="border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {item.label}
          </div>
          <div className="mt-2 text-base font-semibold text-[#1f2937]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}