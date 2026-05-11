import { useState } from "react";
import Link from "next/link";
import { CorridorSummary } from "@/types/corridors";

type SortKey = "name" | "numStops";
type SortDir = "asc" | "desc";

const nameComparator = (a: string, b: string) =>
  a.trim().localeCompare(b.trim(), undefined, { numeric: true });

const sortCorridors = (
  data: CorridorSummary[],
  key: SortKey,
  dir: SortDir,
): CorridorSummary[] => {
  const sorted = [...data].sort((a, b) => {
    if (key === "name") return nameComparator(a.name ?? "", b.name ?? "");
    return (a.numStops ?? 0) - (b.numStops ?? 0);
  });
  return dir === "asc" ? sorted : sorted.reverse();
};

const filterCorridors = (
  data: CorridorSummary[],
  filter: string,
): CorridorSummary[] => {
  const needle = filter.trim().toLowerCase();
  if (!needle) return data;
  return data.filter((c) => (c.name ?? "").toLowerCase().includes(needle));
};

interface Props {
  data: CorridorSummary[];
  filter: string;
  onFilterChange: (value: string) => void;
}

export const CorridorsGrid = ({ data, filter, onFilterChange }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = filterCorridors(data, filter);
  const rows = sortCorridors(filtered, sortKey, sortDir);
  const noMatches = data.length > 0 && rows.length === 0;

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

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

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th
              scope="col"
              className="govuk-table__header"
              aria-sort={ariaSort("name")}
            >
              <button
                type="button"
                className="unbuttoned"
                onClick={() => handleSort("name")}
              >
                Name
              </button>
            </th>
            <th
              scope="col"
              className="govuk-table__header"
              aria-sort={ariaSort("numStops")}
            >
              <button
                type="button"
                className="unbuttoned"
                onClick={() => handleSort("numStops")}
              >
                Stops
              </button>
            </th>
            <th scope="col" className="govuk-table__header">
              <span className="govuk-visually-hidden">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {rows.map((corridor) => (
            <tr key={corridor.id} className="govuk-table__row">
              <td className="govuk-table__cell">
                <Link href={`/corridors/${corridor.id}`} className="govuk-link">
                  {corridor.name}
                </Link>
              </td>
              <td className="govuk-table__cell">{corridor.numStops}</td>
              <td className="govuk-table__cell govuk-!-text-align-right">
                <Link
                  href={`/corridors/edit/${corridor.id}`}
                  className="govuk-link"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {noMatches ? (
        <div role="alert" className="govuk-body">
          No corridors matched the search query.
        </div>
      ) : null}
    </>
  );
};
