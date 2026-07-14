import dynamic from "next/dynamic";
import Link from "next/link";
import { Duration } from "luxon";
import { DateTime } from "luxon";
import { useEffect, useMemo, useRef, useState } from "react";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import { Granularity } from "@/src/generated/graphql";
import { formatPercentage } from "@/utils/maths";
import {
  onTimeService,
  type OperatorPerformance,
  type PerformanceParams,
  type TimeSeriesData,
} from "@/services/on-time/on-time.service";

const OperatorSparkline = dynamic(
  () => import("./OperatorSparkline").then((mod) => mod.OperatorSparkline),
  { ssr: false },
);

const columns = [
  { key: "nocCode", label: "NOC", sortable: false },
  {
    key: "name",
    label: "Operator",
    sortable: false,
    cellClassName: "on-time-operator-table__name-cell",
    headerClassName: "on-time-operator-table__name-header",
  },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTimeRatio", label: "On-time", sortable: true },
  { key: "lateRatio", label: "Late", sortable: true },
  { key: "earlyRatio", label: "Early", sortable: true },
  {
    key: "sparkline",
    label: "",
    sortable: false,
    cellClassName: "on-time-operator-table__sparkline-cell",
  },
];

function getSparklineKey(row: OperatorPerformance): string | null {
  return row.nocCode ?? row.operatorId ?? null;
}

function getSparklineFetchCandidates(row: OperatorPerformance): string[] {
  return [row.nocCode, row.operatorId].filter((value): value is string =>
    Boolean(value),
  );
}

function formatDelay(delay: number | null | undefined): string {
  if (delay == null) return "-";
  const roundedDelay = Math.round(delay);
  return (
    (roundedDelay >= 0 ? "+" : "-") +
    Duration.fromObject({ seconds: Math.abs(roundedDelay) }).toFormat("mm:ss")
  );
}

function getRowValue(
  row: OperatorPerformance,
  column: string,
): string | number {
  switch (column) {
    case "nocCode":
      return row.nocCode ?? "";
    case "name":
      return row.name ?? "";
    case "averageDelay":
      return row.averageDelay ?? 0;
    case "onTimeRatio":
      return row.onTimeRatio ?? -1;
    case "lateRatio":
      return row.lateRatio ?? -1;
    case "earlyRatio":
      return row.earlyRatio ?? -1;
    default:
      return "";
  }
}

function renderRow(
  row: OperatorPerformance,
  sparklineByOperatorId: Record<string, TimeSeriesData[]>,
): SortableTableRow {
  const sparklineKey = getSparklineKey(row);
  const sparklineData = sparklineKey
    ? sparklineByOperatorId[sparklineKey] ?? []
    : [];

  return {
    key: row.nocCode ?? row.name ?? "",
    nocCode: row.nocCode ?? "-",
    name: row.nocCode ? (
      <Link
        href={`/on-time/${encodeURIComponent(row.nocCode)}`}
        className="govuk-link govuk-!-font-weight-bold"
      >
        {row.name}
      </Link>
    ) : (
      row.name ?? "-"
    ),
    averageDelay: formatDelay(row.averageDelay),
    onTimeRatio: formatPercentage(row.onTimeRatio),
    lateRatio: formatPercentage(row.lateRatio),
    earlyRatio: formatPercentage(row.earlyRatio),
    sparkline:
      sparklineKey && sparklineData.length > 0 ? (
        <OperatorSparkline data={sparklineData} />
      ) : (
        "-"
      ),
  };
}

interface OnTimeOperatorTableProps {
  data: OperatorPerformance[];
  sparklineParams?: PerformanceParams | null;
}

export const OnTimeOperatorTable = ({
  data,
  sparklineParams,
}: OnTimeOperatorTableProps) => {
  const [pageRows, setPageRows] = useState<OperatorPerformance[]>([]);
  const [sparklineByOperatorId, setSparklineByOperatorId] = useState<
    Record<string, TimeSeriesData[]>
  >({});
  const inFlightOperatorIdsRef = useRef(new Set<string>());
  const loadedOperatorIdsRef = useRef(new Set<string>());

  const granularSparklineParams = useMemo<PerformanceParams | null>(() => {
    if (!sparklineParams) {
      return null;
    }

    const fromDate = DateTime.fromISO(sparklineParams.fromTimestamp);
    const toDate = DateTime.fromISO(sparklineParams.toTimestamp);
    const granularity =
      Math.abs(toDate.diff(fromDate, "days").days) <= 5
        ? Granularity.Hour
        : Granularity.Day;

    return {
      ...sparklineParams,
      filters: {
        ...sparklineParams.filters,
        granularity,
      },
    };
  }, [sparklineParams]);

  const sparklineParamsKey = useMemo(
    () => JSON.stringify(granularSparklineParams),
    [granularSparklineParams],
  );

  useEffect(() => {
    setSparklineByOperatorId({});
    inFlightOperatorIdsRef.current.clear();
    loadedOperatorIdsRef.current.clear();
  }, [sparklineParamsKey]);

  useEffect(() => {
    if (!granularSparklineParams) {
      return;
    }

    const rowsToFetch = pageRows
      .map((operator) => ({
        displayKey: getSparklineKey(operator),
        fetchCandidates: getSparklineFetchCandidates(operator),
      }))
      .filter(
        (item): item is { displayKey: string; fetchCandidates: string[] } =>
          Boolean(item.displayKey) && item.fetchCandidates.length > 0,
      )
      .filter(
        (item) =>
          !loadedOperatorIdsRef.current.has(item.displayKey) &&
          !inFlightOperatorIdsRef.current.has(item.displayKey),
      );

    if (rowsToFetch.length === 0) {
      return;
    }

    rowsToFetch.forEach((item) =>
      inFlightOperatorIdsRef.current.add(item.displayKey),
    );

    void Promise.all(
      rowsToFetch.map(async ({ displayKey, fetchCandidates }) => {
        let data: TimeSeriesData[] = [];

        for (const candidateId of fetchCandidates) {
          try {
            const candidateData = await onTimeService.fetchOnTimeTimeSeriesData(
              {
                ...granularSparklineParams,
                filters: {
                  ...granularSparklineParams.filters,
                  operatorIds: [candidateId],
                },
              },
            );

            data = candidateData;
            if (candidateData.length > 0) {
              break;
            }
          } catch {
            // Try the next candidate ID for this row.
          }
        }

        return { displayKey, data };
      }),
    )
      .then((results) => {
        results.forEach(({ displayKey }) =>
          loadedOperatorIdsRef.current.add(displayKey),
        );
        setSparklineByOperatorId((existing) => {
          const next = { ...existing };
          results.forEach(({ displayKey, data }) => {
            next[displayKey] = data;
          });
          return next;
        });
      })
      .finally(() => {
        rowsToFetch.forEach((item) =>
          inFlightOperatorIdsRef.current.delete(item.displayKey),
        );
      });
  }, [pageRows, granularSparklineParams]);

  const sortedData = useMemo(
    () =>
      [...data]
        .filter((op): op is OperatorPerformance & { nocCode: string } =>
          Boolean(op.nocCode),
        )
        .sort((a, b) => {
          const aName = (a.name ?? "").toLocaleLowerCase();
          const bName = (b.name ?? "").toLocaleLowerCase();
          return aName.localeCompare(bName);
        }),
    [data],
  );

  const renderOperatorRow = (row: OperatorPerformance) =>
    renderRow(row, sparklineByOperatorId);

  return (
    <SortedPaginatedTable
      columns={columns}
      data={sortedData}
      getRowValue={getRowValue}
      renderRow={renderOperatorRow}
      colWidths={{
        nocCode: "10%",
        name: "30%",
        averageDelay: "12%",
        onTimeRatio: "12%",
        lateRatio: "12%",
        earlyRatio: "12%",
        sparkline: "12%",
      }}
      initialSortKey="name"
      initialSortOrder="asc"
      paginationNoun="operator"
      onPageDataChange={setPageRows}
    />
  );
};
