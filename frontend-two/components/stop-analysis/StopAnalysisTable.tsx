import { useMemo, useState } from "react";
import { Direction, StopPerformanceRow } from "@/types/stop-analysis";

interface StopAnalysisTableProps {
  data: StopPerformanceRow[];
  loading: boolean;
  errored: boolean;
  directions: Direction[];
  onDirectionsChange: (directions: Direction[]) => void;
  onStopNameClick: (stop: StopPerformanceRow) => void;
}

const formatPercent = (value: number | undefined | null): string => {
  if (value == null || isNaN(value) || !isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
};

const formatSeconds = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return "-";
  const mins = Math.floor(Math.abs(value) / 60);
  const secs = Math.round(Math.abs(value) % 60);
  const sign = value < 0 ? "-" : "";
  return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
};

export const StopAnalysisTable = ({
  data,
  loading,
  errored,
  directions,
  onDirectionsChange,
  onStopNameClick,
}: StopAnalysisTableProps) => {
  const [quickFilter, setQuickFilter] = useState("");

  const filteredData = useMemo(
    () =>
      data.filter(
        (row) =>
          directions.length === 0 ||
          directions.length === 2 ||
          (row.direction &&
            directions.includes(row.direction as Direction)),
      ),
    [data, directions],
  );

  const handleDirectionToggle = (dir: Direction) => {
    const newDirs = directions.includes(dir)
      ? directions.filter((d) => d !== dir)
      : [...directions, dir];
    onDirectionsChange(newDirs.length === 0 ? ["Inbound", "Outbound"] : newDirs);
  };

  const handleExportCsv = () => {
    const headers = [
      "NAPTAN",
      "Timing Point",
      "Name",
      "Locality",
      "Admin Area",
      "Direction",
      "Scheduled Departures",
      "Recorded Departures",
      "Recorded %",
      "Av. Scheduled Travel Time",
      "Av. Actual Travel Time",
      "Av. Delay",
      "On Time",
      "On Time %",
      "On Time (avg secs)",
      "Early",
      "Early %",
      "Early (avg secs)",
      "Late",
      "Late %",
      "Late (avg secs)",
    ];

    const rows = filteredData.map((row) => [
      row.stopId,
      row.timingPoint ? "Yes" : "No",
      row.stopName,
      row.localityName,
      row.adminAreaName,
      row.direction ?? "",
      row.scheduledDepartures,
      row.actualDepartures,
      formatPercent(row.completedRatio),
      row.averageScheduled != null ? formatSeconds(row.averageScheduled) : "",
      row.averageActual != null ? formatSeconds(row.averageActual) : "",
      row.averageDelay != null ? formatSeconds(row.averageDelay) : "",
      row.onTime,
      formatPercent(row.onTimeRatio),
      row.onTimeInSeconds != null ? row.onTimeInSeconds.toFixed(0) : "",
      row.early,
      formatPercent(row.earlyRatio),
      row.earlyInSeconds != null ? row.earlyInSeconds.toFixed(0) : "",
      row.late,
      formatPercent(row.lateRatio),
      row.lateInSeconds != null ? row.lateInSeconds.toFixed(0) : "",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stop-analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const searchFilteredData = useMemo(() => {
    if (!quickFilter) return filteredData;
    const lower = quickFilter.toLowerCase();
    return filteredData.filter(
      (row) =>
        row.stopId.toLowerCase().includes(lower) ||
        row.stopName.toLowerCase().includes(lower) ||
        row.localityName.toLowerCase().includes(lower),
    );
  }, [filteredData, quickFilter]);

  if (errored) {
    return (
      <div className="govuk-!-margin-top-6">
        <p className="govuk-body govuk-error-message">
          There was a problem loading the data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="stop-analysis-table govuk-!-margin-top-6">
      <div className="stop-analysis-table__controls">
        <div className="stop-analysis-table__direction-filters">
          <fieldset className="govuk-fieldset">
            <legend className="govuk-visually-hidden">Filter by direction</legend>
            <div className="govuk-checkboxes govuk-checkboxes--small govuk-checkboxes--inline">
              <div className="govuk-checkboxes__item">
                <input
                  className="govuk-checkboxes__input"
                  id="dir-inbound"
                  type="checkbox"
                  checked={directions.includes("Inbound")}
                  onChange={() => handleDirectionToggle("Inbound")}
                />
                <label className="govuk-checkboxes__label" htmlFor="dir-inbound">
                  Inbound
                </label>
              </div>
              <div className="govuk-checkboxes__item">
                <input
                  className="govuk-checkboxes__input"
                  id="dir-outbound"
                  type="checkbox"
                  checked={directions.includes("Outbound")}
                  onChange={() => handleDirectionToggle("Outbound")}
                />
                <label className="govuk-checkboxes__label" htmlFor="dir-outbound">
                  Outbound
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        <div className="stop-analysis-table__search">
          <input
            className="govuk-input govuk-input--width-20"
            type="text"
            placeholder="Search stops..."
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            aria-label="Search stops"
          />
        </div>

        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          onClick={handleExportCsv}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="govuk-body">Loading...</p>
      ) : (
        <div className="stop-analysis-table__grid">
          <table className="govuk-table">
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th className="govuk-table__header" scope="col">NAPTAN</th>
                <th className="govuk-table__header" scope="col">TP</th>
                <th className="govuk-table__header" scope="col">Name</th>
                <th className="govuk-table__header" scope="col">Direction</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Scheduled</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Recorded</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Av. Sched.</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Av. Actual</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Av. Delay</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">On Time</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Early</th>
                <th className="govuk-table__header govuk-table__header--numeric" scope="col">Late</th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {searchFilteredData.length === 0 ? (
                <tr className="govuk-table__row">
                  <td className="govuk-table__cell" colSpan={12}>
                    No data available
                  </td>
                </tr>
              ) : (
                searchFilteredData.slice(0, 100).map((row) => (
                  <tr key={`${row.stopId}-${row.direction}`} className="govuk-table__row">
                    <td className="govuk-table__cell">{row.stopId}</td>
                    <td className="govuk-table__cell">
                      {row.timingPoint ? "⏱" : ""}
                    </td>
                    <td className="govuk-table__cell">
                      <button
                        type="button"
                        className="govuk-link stop-analysis-table__stop-link"
                        onClick={() => onStopNameClick(row)}
                        title={`${row.localityName}, ${row.adminAreaName}`}
                      >
                        {row.stopName}
                      </button>
                    </td>
                    <td className="govuk-table__cell">
                      {row.direction ?? "-"}
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.scheduledDepartures}
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.actualDepartures} ({formatPercent(row.completedRatio)})
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.averageScheduled != null ? formatSeconds(row.averageScheduled) : "-"}
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.averageActual != null ? formatSeconds(row.averageActual) : "-"}
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.averageDelay != null ? formatSeconds(row.averageDelay) : "-"}
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.onTime} ({formatPercent(row.onTimeRatio)})
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.early} ({formatPercent(row.earlyRatio)})
                    </td>
                    <td className="govuk-table__cell govuk-table__cell--numeric">
                      {row.late} ({formatPercent(row.lateRatio)})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {searchFilteredData.length > 100 && (
            <p className="govuk-body govuk-!-margin-top-2">
              Showing 100 of {searchFilteredData.length} stops. Use search to narrow results.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
