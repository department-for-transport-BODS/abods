import { clsx } from "clsx";
import styles from "./stop-analysis-table.module.scss";
import { useMemo, useState, type ReactNode } from "react";
import { Direction, StopPerformanceRow } from "@/types/stop-analysis";
import {
  DISPLAY_MODE_OPTIONS,
  formatMetricValue,
  formatPercent,
  formatSeconds,
  getMetricSortValue,
  useStopPerformanceTable,
  type DisplayMode,
} from "@/hooks/useStopPerformanceTable";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
import { DisplayOptionsModal } from "@/components/shared/DisplayOptionsModal/DisplayOptionsModal";
import { Tooltip } from "@/components/shared/Tooltip";
import {
  SortedPaginatedTable,
  type SortedPaginatedTableColumn,
} from "../table/SortedPaginatedTable";
import { type SortOrder } from "../table/SortableTable";
import { TimingIcon } from "../icons/TimingIcon";

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
  timingPoint: ReactNode;
  stopName: React.ReactNode;
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
  modalLabel?: string;
  alwaysVisible?: boolean;
}

const TABLE_COLUMN_OPTIONS: TableColumnDefinition[] = [
  { key: "stopId", label: "NAPTAN", alwaysVisible: true },
  {
    key: "timingPoint",
    label: <TimingIcon className={styles["stop-analysis-table__timing-icon"]} />,
    modalLabel: "Timing Point",
  },
  { key: "stopName", label: "Name" },
  { key: "direction", label: "Direction" },
  {
    key: "scheduledDepartures",
    label: "Scheduled departures",
    modalLabel: "Scheduled departures",
  },
  {
    key: "actualDepartures",
    label: "Recorded departures",
    modalLabel: "Recorded departures",
  },
  {
    key: "averageScheduled",
    label: "Av. Scheduled Travel Time",
    modalLabel: "Average scheduled",
  },
  {
    key: "averageActual",
    label: "Av. Actual Travel Time",
    modalLabel: "Average actual",
  },
  { key: "averageDelay", label: "Av. Delay", modalLabel: "Average delay" },
  { key: "onTime", label: "On Time" },
  { key: "late", label: "Late" },
  { key: "early", label: "Early" },
];

const COLUMN_LABELS: Record<string, ReactNode> = {
  stopId: "NAPTAN",
  timingPoint: "Timing Point",
  stopName: "Name",
  direction: "Direction",
  scheduledDepartures: "Scheduled departures",
  actualDepartures: "Recorded departures",
  averageScheduled: "Average scheduled",
  averageActual: "Average actual",
  averageDelay: "Average delay",
  onTime: "On time",
  late: "Late",
  early: "Early",
};
const ALWAYS_VISIBLE_KEYS = ["stopId"];

interface StopAnalysisTableProps {
  data: StopPerformanceRow[];
  errored: boolean;
  directions: Direction[];
  onDirectionsChange: (directions: Direction[]) => void;
  onStopNameClick: (stop: StopPerformanceRow) => void;
  showTotals?: boolean;
}

const formatDirection = (direction: string | null): string => {
  if (!direction) return "-";

  return direction.charAt(0).toUpperCase() + direction.slice(1);
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
  errored,
  directions,
  onDirectionsChange,
  onStopNameClick,
  showTotals = false,
}: StopAnalysisTableProps) => {
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>(
    TABLE_COLUMN_OPTIONS.map((column) => column.key),
  );
  const [sortState, setSortState] = useState<{
    key: SortKey;
    order: SortOrder;
  }>({
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
          directions.length === 2 ||
          (row.direction &&
            directions.includes(formatDirection(row.direction) as Direction)),
      ),
    [data, directions],
  );

  const { displayMode, setDisplayMode, totals } = useStopPerformanceTable(
    filteredData,
    showTotals,
  );

  const visibleColumnSet = useMemo(
    () => new Set(visibleColumns),
    [visibleColumns],
  );

  const tableColumns = useMemo<SortedPaginatedTableColumn[]>(
    () =>
      TABLE_COLUMN_OPTIONS.filter((column) =>
        visibleColumnSet.has(column.key),
      ).map((column) => ({
        key: column.key,
        label: column.label,
        ariaLabel:
          column.modalLabel ??
          (typeof column.label === "string" ? column.label : column.key),
        alignment:
          column.key === "direction" ||
          column.key === "stopId" ||
          column.key === "timingPoint" ||
          column.key === "stopName"
            ? "left"
            : "right",
        sortable:
          column.key !== "stopId" &&
          column.key !== "stopName" &&
          column.key !== "timingPoint",
      })),
    [visibleColumnSet],
  );

  const totalsRow = useMemo<SortableRow | null>(
    () =>
      totals
        ? {
            key: "__totals__",
            rowClassName: styles["stop-analysis-table__summary-row"],
            stopId: "-",
            timingPoint: "",
            stopName: "-",
            direction: "-",
            ...totals,
          }
        : null,
    [totals],
  );

  const handleSortChange = (key: string | null, order: SortOrder) => {
    if (!key) return;
    setSortState({ key: key as SortKey, order });
  };

  const openDisplayOptions = () => {
    setShowDisplayOptions(true);
  };

  const handleDisplayOptionsApply = (newVisibleColumns: string[]) => {
    setVisibleColumns(newVisibleColumns as TableColumnKey[]);

    if (!newVisibleColumns.includes(sortState.key as string)) {
      setSortState({ key: "stopName", order: SORT_ASC });
    }
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
    <div className={clsx(styles["stop-analysis-table"], "govuk-!-margin-top-6")}>
      <div className={styles["stop-analysis-table__display-toolbar"]}>
        <div className={styles["stop-analysis-table__display-actions"]}>
          <button
            type="button"
            className={clsx("govuk-link", "button-link", styles["stop-analysis-table__display-options-link"])}
            onClick={openDisplayOptions}
          >
            Display options
          </button>
          <fieldset
            className={clsx("govuk-fieldset", styles["stop-analysis-table__display-mode"])}
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
      <DisplayOptionsModal
        open={showDisplayOptions}
        columnKeys={TABLE_COLUMN_OPTIONS.map((c) => c.key)}
        visibleColumns={visibleColumns}
        alwaysVisibleKeys={ALWAYS_VISIBLE_KEYS}
        columnLabels={COLUMN_LABELS}
        onClose={() => setShowDisplayOptions(false)}
        onApply={handleDisplayOptionsApply}
      />
      <div className={styles["stop-analysis-table__controls"]}>
        <div className={styles["stop-analysis-table__direction-filters"]}>
          <MultiselectCheckbox
            id="stop-analysis-directions"
            label="Directions"
            showAllLabel="All Directions"
            options={directionOptions}
            selectedValues={directions}
            onChange={(values) => onDirectionsChange(values as Direction[])}
            placeholder="Directions"
          />
        </div>
      </div>

      <div className={styles["stop-analysis-table__grid"]}>
        <div
          className={showTotals ? styles["stop-analysis-table__table--with-totals"] : undefined}
        >
          <SortedPaginatedTable
            key={`${displayMode}-${visibleColumns.join(",")}`}
            columns={tableColumns}
            data={filteredData}
            getRowValue={(row, column) =>
              getSortValue(row, column as SortKey, displayMode)
            }
            renderRow={(row) => ({
              key: `${row.stopId}-${row.direction}`,
              stopId: row.stopId,
              timingPoint: row.timingPoint ? (
                <TimingIcon className={styles["stop-analysis-table__timing-icon"]} />
              ) : (
                ""
              ),
              stopName: (
                <Tooltip
                  message={`${row.localityName}, ${row.adminAreaName}`}
                  className={styles["stop-analysis-table__stop-link"]}
                  onClick={() => onStopNameClick(row)}
                >
                  {row.stopName}
                </Tooltip>
              ),
              direction: formatDirection(row.direction),
              scheduledDepartures: row.scheduledDepartures,
              actualDepartures:
                displayMode === "percentage"
                  ? formatPercent(row.completedRatio)
                  : String(row.actualDepartures),
              averageScheduled:
                row.averageScheduled != null
                  ? formatSeconds(row.averageScheduled, true)
                  : "-",
              averageActual:
                row.averageActual != null
                  ? formatSeconds(row.averageActual, true)
                  : "-",
              averageDelay:
                row.averageDelay != null
                  ? formatSeconds(row.averageDelay)
                  : "-",
              onTime: formatMetricValue(row, "onTime", displayMode),
              early: formatMetricValue(row, "early", displayMode),
              late: formatMetricValue(row, "late", displayMode),
            })}
            pinnedRows={totalsRow ? [totalsRow] : undefined}
            onSortChange={handleSortChange}
            colWidths={{
              stopId: "8rem",
              timingPoint: "2rem",
              stopName: "12rem",
              direction: "5.5rem",
              scheduledDepartures: "5rem",
              actualDepartures: "6rem",
              averageScheduled: "5rem",
              averageActual: "5rem",
              averageDelay: "5rem",
              onTime: "4.5rem",
              early: "4.5rem",
              late: "4.5rem",
            }}
            initialSortKey={sortState.key}
            initialSortOrder={sortState.order}
            emptyMessage="No stop data found"
            paginationNoun="stop"
            paginationAlignment="left"
          />
        </div>
      </div>
    </div>
  );
};
