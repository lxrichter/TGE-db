import { formatCount } from "@/lib/format";

export default function ReviewTablePagination({
  noun,
  page,
  pageCount,
  pageStart,
  pageEnd,
  total,
  onPageChange,
}: {
  noun: string;
  page: number;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return (
      <div className="border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(total)} {noun}
        {total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of{" "}
        {formatCount(total)} {noun}
        {total === 1 ? "" : "s"}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className="inline-flex h-8 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-gray-700">
          Page {formatCount(page)} / {formatCount(pageCount)}
        </span>
        <button
          className="h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= pageCount}
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
