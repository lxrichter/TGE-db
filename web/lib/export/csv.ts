export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

function formatCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function escapeCsvCell(value: unknown) {
  const formatted = formatCsvCell(value);

  if (/[",\n\r]/.test(formatted)) {
    return `"${formatted.replaceAll('"', '""')}"`;
  }

  return formatted;
}

export function rowsToCsv<T>(columns: CsvColumn<T>[], rows: T[]) {
  return [
    columns.map((column) => escapeCsvCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsvCell(column.value(row))).join(",")
    ),
  ].join("\n");
}

export function csvDownloadResponse<T>({
  filename,
  columns,
  rows,
}: {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
}) {
  return new Response(rowsToCsv(columns, rows), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
