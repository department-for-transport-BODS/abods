import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Direction, StopPerformanceRow } from "@/types/stop-analysis";
import { MultiselectCheckbox } from "./MultiselectCheckbox";
import { Modal } from "@/components/shared/Modal";
import { SortableTable, type SortOrder } from "../table/SortableTable";
import { TimingIcon } from "./TimingIcon";

type SortKey =
  | "stopId"
  | "timingPoint"
  | "stopName"
  | "direction"
  | "scheduledDepartures"
  | "actualDepartures"
  | "averageScheduled"
  | "averageActual"
  | "averageDelay"
  | "onTime"
  | "early"
  | "late";

type SortableRow = {
  key: string;
  stopId: string;
  timingPoint: string;
  stopName: React.ReactNode;
  source: StopPerformanceRow;
  direction: string;
  scheduledDepartures: number;
  actualDepartures: string;
  averageScheduled: string;
  averageActual: string;
  averageDelay: string;
  onTime: string;
  early: string;
  late: string;
};

type DisplayMode = "percentage" | "count" | "time";

type TableColumnKey =
  | "stopId"
  | "timingPoint"
  | "stopName"
  | "direction"
  | "scheduledDepartures"
  | "actualDepartures"
  | "averageScheduled"
  | "averageActual"
  | "averageDelay"
  | "onTime"
  | "early"
  | "late";

interface TableColumnDefinition {
  key: TableColumnKey;
  label: ReactNode;
  alwaysVisible?: boolean;
}

const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "count", label: "Count" },
  { value: "time", label: "Time" },
];

const TABLE_COLUMN_OPTIONS: TableColumnDefinition[] = [
  { key: "stopId", label: "NAPTAN", alwaysVisible: true },
  {
    key: "timingPoint",
    label: <TimingIcon className="stop-analysis-table__timing-icon" />,
  },
  { key: "stopName", label: "Name", alwaysVisible: true },
  { key: "direction", label: "Direction" },
  { key: "scheduledDepartures", label: "Scheduled" },
  { key: "actualDepartures", label: "Recorded" },
  { key: "averageScheduled", label: "Av. Sched." },
  { key: "averageActual", label: "Av. Actual" },
  { key: "averageDelay", label: "Av. Delay" },
  { key: "onTime", label: "On Time" },
  { key: "early", label: "Early" },
  { key: "late", label: "Late" },
];

interface StopAnalysisTableProps {
  data: StopPerformanceRow[];
  loading: boolean;
  errored: boolean;
  directions: Direction[];
  onDirectionsChange: (directions: Direction[]) => void;
  onStopNameClick: (stop: StopPerformanceRow) => void;
  showTotals?: boolean;
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

const formatDirection = (direction: string | null): string => {
  if (!direction) return "-";

  return direction.charAt(0).toUpperCase() + direction.slice(1);
};

const formatMetricValue = (
  row: StopPerformanceRow,
  metric: "onTime" | "early" | "late",
  displayMode: DisplayMode,
): string => {
  switch (displayMode) {
    case "count":
      return String(row[metric]);
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return formatSeconds(row[secondsKey]);
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return formatPercent(row[ratioKey]);
    }
  }
};

const getMetricSortValue = (
  row: StopPerformanceRow,
  metric: "onTime" | "early" | "late",
  displayMode: DisplayMode,
): string | number => {
  switch (displayMode) {
    case "count":
      return row[metric];
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return row[secondsKey] ?? Number.NEGATIVE_INFINITY;
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return row[ratioKey] ?? Number.NEGATIVE_INFINITY;
    }
  }
};

const compareValue = (a: string | number, b: string | number): number => {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

const SORT_ASC: SortOrder = "asc";

const getSortValue = (
  row: StopPerformanceRow,
  key: SortKey,
  displayMode: DisplayMode,
): string | number => {
  switch (key) {
    case "timingPoint":
      return row.timingPoint ? 1 : 0;
    case "direction":
      return row.direction ?? "";
    case "averageScheduled":
      return row.averageScheduled ?? Number.NEGATIVE_INFINITY;
    case "averageActual":
      return row.averageActual ?? Number.NEGATIVE_INFINITY;
    case "averageDelay":
      return row.averageDelay ?? Number.NEGATIVE_INFINITY;
    case "onTime":
      return getMetricSortValue(row, "onTime", displayMode);
    case "early":
      return getMetricSortValue(row, "early", displayMode);
    case "late":
      return getMetricSortValue(row, "late", displayMode);
    case "scheduledDepartures":
      return row.scheduledDepartures;
    case "actualDepartures":
      return row.actualDepartures;
    case "stopName":
      return row.stopName;
    case "stopId":
    default:
      return row.stopId;
  }
};

export const StopAnalysisTable = ({
  data,
  loading,
  errored,
  directions,
  onDirectionsChange,
  onStopNameClick,
  showTotals = false,
}: StopAnalysisTableProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("percentage");
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<TableColumnKey[]>(
    TABLE_COLUMN_OPTIONS.map((column) => column.key),
  );
  const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>(
    TABLE_COLUMN_OPTIONS.map((column) => column.key),
  );
  const [sortState, setSortState] = useState<{ key: SortKey; order: SortOrder }>({
    key: "stopName",
    order: SORT_ASC,
  });

  const directionOptions = useMemo(
    () => [
      { label: "Inbound", value: "Inbound" },
      { label: "Outbound", value: "Outbound" },
    ],
    [],
  );

  const filteredData = useMemo(
    () =>
      data.filter(
        (row) =>
          directions.length === 0 ||
          directions.length === 2 ||
          (row.direction &&
            directions.includes(formatDirection(row.direction) as Direction)),
      ),
    [data, directions],
  );

  const sortedRows = useMemo(() => {
    const rows = [...filteredData];
    rows.sort((left, right) => {
      const leftValue = getSortValue(left, sortState.key, displayMode);
      const rightValue = getSortValue(right, sortState.key, displayMode);
      const result = compareValue(leftValue, rightValue);
      return sortState.order === SORT_ASC ? result : -result;
    });
    return rows;
  }, [displayMode, filteredData, sortState]);

  useEffect(() => {
    setCurrentPage(0);
  }, [sortedRows]);

  const visibleColumnSet = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  const tableColumns = useMemo(
    () =>
      TABLE_COLUMN_OPTIONS.filter((column) => visibleColumnSet.has(column.key)).map(
        (column) => ({
          key: column.key,
          label: column.label,
          sortable: column.key !== "stopId" && column.key !== "stopName" && column.key !== "timingPoint",
          sortOrder:
            sortState.key === column.key ? sortState.order : undefined,
        }),
      ),
    [sortState, visibleColumnSet],
  );

  const tableHead = tableColumns;

  const totalsRow = useMemo<SortableRow | null>(() => {
    if (!filteredData.length) return null;

    const totalScheduled = filteredData.reduce((sum, r) => sum + r.scheduledDepartures, 0);
    const totalActual = filteredData.reduce((sum, r) => sum + r.actualDepartures, 0);
    const totalOnTime = filteredData.reduce((sum, r) => sum + r.onTime, 0);
    const totalEarly = filteredData.reduce((sum, r) => sum + r.early, 0);
    const totalLate = filteredData.reduce((sum, r) => sum + r.late, 0);
    const completedRatio = totalScheduled > 0 ? totalActual / totalScheduled : null;

    const avgDelayWeighted = filteredData.reduce((sum, r) =>
      r.averageDelay != null ? sum + r.averageDelay * r.actualDepartures : sum, 0);
    const avgDelay = totalActual > 0 ? avgDelayWeighted / totalActual : null;

    const rowsWithScheduled = filteredData.filter((r) => r.averageScheduled != null);
    const avgScheduled = rowsWithScheduled.length
      ? rowsWithScheduled.reduce((sum, r) => sum + (r.averageScheduled ?? 0), 0) / rowsWithScheduled.length
      : null;

    const rowsWithActual = filteredData.filter((r) => r.averageActual != null);
    const avgActual = rowsWithActual.length
      ? rowsWithActual.reduce((sum, r) => sum + (r.averageActual ?? 0), 0) / rowsWithActual.length
      : null;

    let onTimeVal: string;
    let earlyVal: string;
    let lateVal: string;

    switch (displayMode) {
      case "count":
        onTimeVal = String(totalOnTime);
        earlyVal = String(totalEarly);
        lateVal = String(totalLate);
        break;
      case "time": {
        const onTimeSecs = filteredData.reduce((sum, r) => sum + (r.onTimeInSeconds ?? 0) * r.onTime, 0);
        const earlySecs = filteredData.reduce((sum, r) => sum + (r.earlyInSeconds ?? 0) * r.early, 0);
        const lateSecs = filteredData.reduce((sum, r) => sum + (r.lateInSeconds ?? 0) * r.late, 0);
        onTimeVal = totalOnTime > 0 ? formatSeconds(onTimeSecs / totalOnTime) : "-";
        earlyVal = totalEarly > 0 ? formatSeconds(earlySecs / totalEarly) : "-";
        lateVal = totalLate > 0 ? formatSeconds(lateSecs / totalLate) : "-";
        break;
      }
      case "percentage":
      default:
        onTimeVal = totalActual > 0 ? formatPercent(totalOnTime / totalActual) : "-";
        earlyVal = totalActual > 0 ? formatPercent(totalEarly / totalActual) : "-";
        lateVal = totalActual > 0 ? formatPercent(totalLate / totalActual) : "-";
    }

    return {
      key: "__totals__",
      stopId: "-",
      timingPoint: "",
      stopName: "-",
      source: null as unknown as StopPerformanceRow,
      direction: "-",
      scheduledDepartures: totalScheduled,
      actualDepartures: completedRatio != null
        ? `${totalActual} (${formatPercent(completedRatio)})`
        : String(totalActual),
      averageScheduled: avgScheduled != null ? formatSeconds(avgScheduled) : "-",
      averageActual: avgActual != null ? formatSeconds(avgActual) : "-",
      averageDelay: avgDelay != null ? formatSeconds(avgDelay) : "-",
      onTime: onTimeVal,
      early: earlyVal,
      late: lateVal,
    };
  }, [filteredData, displayMode]);

  const PAGE_SIZE = 10;

  const tableRows = useMemo<SortableRow[]>(
    () => sortedRows
      .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
      .map((row) => ({
      key: `${row.stopId}-${row.direction}`,
      stopId: row.stopId,
      timingPoint: row.timingPoint ? <TimingIcon className="stop-analysis-table__timing-icon" /> : "",
      stopName: (
        <button
          type="button"
          className="govuk-link stop-analysis-table__stop-link"
          onClick={() => onStopNameClick(row)}
          title={`${row.localityName}, ${row.adminAreaName}`}
        >
          {row.stopName}
        </button>
      ),
      source: row,
      direction: formatDirection(row.direction),
      scheduledDepartures: row.scheduledDepartures,
      actualDepartures: `${row.actualDepartures} (${formatPercent(row.completedRatio)})`,
      averageScheduled: row.averageScheduled != null ? formatSeconds(row.averageScheduled) : "-",
      averageActual: row.averageActual != null ? formatSeconds(row.averageActual) : "-",
      averageDelay: row.averageDelay != null ? formatSeconds(row.averageDelay) : "-",
      onTime: formatMetricValue(row, "onTime", displayMode),
      early: formatMetricValue(row, "early", displayMode),
      late: formatMetricValue(row, "late", displayMode),
    })),
    [displayMode, onStopNameClick, sortedRows, currentPage],
  );

  const allTableRows = useMemo(
    () => showTotals && totalsRow ? [totalsRow, ...tableRows] : tableRows,
    [showTotals, totalsRow, tableRows],
  );

  const handleSort = (key: string, order: SortOrder) => {
    setSortState({ key: key as SortKey, order });
  };

  const openDisplayOptions = () => {
    setDraftVisibleColumns(visibleColumns);
    setShowDisplayOptions(true);
  };

  const toggleDraftColumnVisibility = (key: TableColumnKey, visible: boolean) => {
    if (key === "stopName") {
      return;
    }

    setDraftVisibleColumns((current) => {
      if (visible) {
        return current.includes(key) ? current : [...current, key];
      }

      const next = current.filter((columnKey) => columnKey !== key);
      return next.includes("stopName") ? next : ["stopName", ...next];
    });
  };

  const showAllColumns = () => {
    setDraftVisibleColumns(TABLE_COLUMN_OPTIONS.map((column) => column.key));
  };

  const applyDisplayOptions = () => {
    setVisibleColumns(draftVisibleColumns);

    if (!draftVisibleColumns.includes(sortState.key as TableColumnKey)) {
      setSortState({ key: "stopName", order: SORT_ASC });
    }

    setShowDisplayOptions(false);
  };

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
      <div className="stop-analysis-table__display-toolbar">
        <div className="stop-analysis-table__display-actions">
          <button
            type="button"
            className="govuk-link stop-analysis-table__display-options-link"
            onClick={openDisplayOptions}
          >
            Display options
          </button>
          <fieldset
            className="govuk-fieldset stop-analysis-table__display-mode"
            aria-label="Show stop performance values as"
          >
            <legend className="govuk-visually-hidden">
              Show stop performance values as
            </legend>
            <div className="govuk-radios govuk-radios--inline govuk-radios--small">
              {DISPLAY_MODE_OPTIONS.map((option) => (
                <div key={option.value} className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id={`stop-analysis-display-mode-${option.value}`}
                    name="stop-analysis-display-mode"
                    type="radio"
                    value={option.value}
                    checked={displayMode === option.value}
                    onChange={() => setDisplayMode(option.value)}
                  />
                  <label
                    className="govuk-label govuk-radios__label"
                    htmlFor={`stop-analysis-display-mode-${option.value}`}
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
      <Modal
        open={showDisplayOptions}
        title="Display options"
        closeLabel="Close display options"
        showCloseButton={false}
        onClose={() => setShowDisplayOptions(false)}
      >
        <div className="stop-analysis-table__display-modal">
          <div className="stop-analysis-table__display-columns">
            <div className="stop-analysis-table__display-column govuk-checkboxes govuk-checkboxes--small">
              {TABLE_COLUMN_OPTIONS.slice(0, 6).map((column) => {
                const checked = draftVisibleColumns.includes(column.key);

                return (
                  <div key={column.key} className="govuk-checkboxes__item">
                    <input
                      className="govuk-checkboxes__input"
                      id={`stop-analysis-column-${column.key}`}
                      type="checkbox"
                      checked={checked}
                      disabled={column.alwaysVisible}
                      onChange={(event) =>
                        toggleDraftColumnVisibility(column.key, event.target.checked)
                      }
                    />
                    <label
                      className="govuk-label govuk-checkboxes__label"
                      htmlFor={`stop-analysis-column-${column.key}`}
                    >
                      {column.label}
                    </label>
                  </div>
                );
              })}

              <button
                type="button"
                className="govuk-link stop-analysis-table__show-all-link"
                onClick={showAllColumns}
              >
                Show all
              </button>
            </div>

            <div className="stop-analysis-table__display-column govuk-checkboxes govuk-checkboxes--small">
              {TABLE_COLUMN_OPTIONS.slice(6).map((column) => {
                const checked = draftVisibleColumns.includes(column.key);

                return (
                  <div key={column.key} className="govuk-checkboxes__item">
                    <input
                      className="govuk-checkboxes__input"
                      id={`stop-analysis-column-${column.key}`}
                      type="checkbox"
                      checked={checked}
                      disabled={column.alwaysVisible}
                      onChange={(event) =>
                        toggleDraftColumnVisibility(column.key, event.target.checked)
                      }
                    />
                    <label
                      className="govuk-label govuk-checkboxes__label"
                      htmlFor={`stop-analysis-column-${column.key}`}
                    >
                      {column.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stop-analysis-table__display-footer">
            <button
              type="button"
              className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
              onClick={() => setShowDisplayOptions(false)}
            >
              Cancel
            </button>
            <button type="button" className="govuk-button govuk-!-margin-bottom-0" onClick={applyDisplayOptions}>
              Update
            </button>
          </div>
        </div>
      </Modal>
      <div className="stop-analysis-table__controls">
        <div className="stop-analysis-table__direction-filters">
          <MultiselectCheckbox
            id="sa-directions"
            label="Directions"
            options={directionOptions}
            selectedValues={
              directions.length === 2 ? [] : directions.map((direction) => direction)
            }
            onChange={(values) =>
              onDirectionsChange(
                values.length === 0 || values.length === 2
                  ? ["Inbound", "Outbound"]
                  : (values as Direction[]),
              )
            }
            showAllLabel="All Directions"
            placeholder="Directions"
          />
        </div>

      </div>

      <div className="stop-analysis-table__grid">
        <div className={showTotals ? "stop-analysis-table__table--with-totals" : undefined}>
          <SortableTable
            head={tableHead as any}
            rows={allTableRows as any[]}
            onSort={handleSort}
            pagination={!loading && sortedRows.length > PAGE_SIZE ? {
              currentPage,
              totalPages: Math.ceil(sortedRows.length / PAGE_SIZE),
              pageSize: PAGE_SIZE,
              rowCount: sortedRows.length,
              noun: "stop",
              onPageChange: setCurrentPage,
            } : undefined}
          />
        </div>
        {loading ? (
          <p className="govuk-body govuk-!-margin-top-4 govuk-!-text-align-centre">Loading...</p>
        ) : allTableRows.length === 0 ? (
          <p className="govuk-body govuk-!-margin-top-4 govuk-!-text-align-centre">No stop data found</p>
        ) : null}
      </div>
    </div>
  );
};
