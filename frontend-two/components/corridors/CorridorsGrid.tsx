import { useMemo } from "react";
import Link from "next/link";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import { CorridorSummary } from "@/types/corridors";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "numStops", label: "Stops", sortable: true },
  { key: "edit", label: "", sortable: false },
];

function getRowValue(row: CorridorSummary, column: string): string | number {
  switch (column) {
    case "name":
      return row.name ?? "";
    case "numStops":
      return row.numStops ?? 0;
    default:
      return "";
  }
}

function renderRow(corridor: CorridorSummary): SortableTableRow {
  return {
    key: String(corridor.id),
    name: (
      <Link href={`/corridors/${corridor.id}`} className="govuk-link">
        {corridor.name}
      </Link>
    ),
    numStops: corridor.numStops ?? 0,
    edit: (
      <Link href={`/corridors/edit/${corridor.id}`} className="govuk-link">
        Edit
      </Link>
    ),
  };
}

interface Props {
  data: CorridorSummary[];
  filter: string;
  onFilterChange: (value: string) => void;
}

export const CorridorsGrid = ({ data, filter, onFilterChange }: Props) => {
  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((c) => (c.name ?? "").toLowerCase().includes(needle));
  }, [data, filter]);

  const noMatches = data.length > 0 && filtered.length === 0;

  return (
    <>
      <div className="govuk-grid-row govuk-!-margin-bottom-4">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <div className="govuk-form-group govuk-!-margin-bottom-0">
            <label className="govuk-label" htmlFor="corridors-grid-filter">
              Search for a corridor
            </label>
            <input
              id="corridors-grid-filter"
              name="filter"
              type="search"
              className="govuk-input govuk-input--width-20"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
            />
          </div>
        </div>
        <div className="govuk-grid-column-one-third-from-desktop govuk-!-text-align-right">
          <Link
            href="/corridors/create"
            role="button"
            draggable={false}
            className="govuk-button"
            data-module="govuk-button"
          >
            Create new corridor
          </Link>
        </div>
      </div>

      <SortedPaginatedTable
        columns={COLUMNS}
        data={filtered}
        getRowValue={getRowValue}
        renderRow={renderRow}
        initialSortKey="name"
        initialSortOrder="asc"
      />

      {noMatches ? (
        <div role="alert" className="govuk-body">
          No corridors matched the search query.
        </div>
      ) : null}
    </>
  );
};
