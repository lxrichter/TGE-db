"use client";

import { useEffect, useMemo, useState } from "react";

export type ExportColumn = {
  key: string;
  label: string;
  defaultSelected?: boolean;
};

export default function ExportExcelModal({
  title,
  columns,
  isOpen,
  onClose,
  onExport,
  exporting = false,
}: {
  title: string;
  columns: ExportColumn[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedKeys: string[]) => Promise<void> | void;
  exporting?: boolean;
}) {
  const defaultSelected = useMemo(
    () => columns.filter((c) => c.defaultSelected).map((c) => c.key),
    [columns]
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultSelected);

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(defaultSelected);
    }
  }, [isOpen, defaultSelected]);

  if (!isOpen) return null;

  function toggleKey(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function selectAll() {
    setSelectedKeys(columns.map((c) => c.key));
  }

  function resetDefault() {
    setSelectedKeys(defaultSelected);
  }

  async function handleExport() {
    if (selectedKeys.length === 0) return;
    await onExport(selectedKeys);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-3xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select the columns to include in the Excel export.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={resetDefault}
              className="border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset Default
            </button>
          </div>

          <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            {columns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-3 border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(column.key)}
                  onChange={() => toggleKey(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
          <div className="text-sm text-gray-500">
            {selectedKeys.length} column{selectedKeys.length === 1 ? "" : "s"} selected
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedKeys.length === 0}
              className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Download Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}