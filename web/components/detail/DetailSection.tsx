type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function DetailSection({
  title,
  children,
}: DetailSectionProps) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}