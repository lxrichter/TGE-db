import * as XLSX from "xlsx";

type ExportColumn = {
  key: string;
  label: string;
};

export function downloadWorkbookFromRows(args: {
  fileName: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}) {
  const { fileName, sheetName, columns, rows } = args;

  const exportRows = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const column of columns) {
      out[column.label] = row[column.key] ?? "";
    }
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}