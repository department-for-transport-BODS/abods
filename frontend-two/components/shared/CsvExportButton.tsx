interface CsvExportButtonProps {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  buttonText?: string;
  className?: string;
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value == null) return "";

  const valueAsString = String(value);
  if (/[,"\n\r]/.test(valueAsString)) {
    return `"${valueAsString.replace(/"/g, '""')}"`;
  }

  return valueAsString;
}

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const csvRows = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];
  const csv = csvRows.join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const CsvExportButton = ({
  filename,
  headers,
  rows,
  buttonText = "Export CSV",
  className,
}: CsvExportButtonProps) => {
  const canExport = headers.length > 0 && rows.length > 0;

  return (
    <button
      type="button"
      className={`govuk-button govuk-button--secondary govuk-!-margin-bottom-0 ${className ?? ""}`.trim()}
      disabled={!canExport}
      onClick={() => downloadCsv(filename, headers, rows)}
    >
      {buttonText}
    </button>
  );
};