import styles from "./chart-no-data-wrapper.module.scss";

import { ReactNode } from "react";
import ExclamationInCircleIcon from "@/assets/icons/exclamation-in-circle.svg";

interface ChartNoDataWrapperProps {
  noData?: boolean;
  dataExpected?: boolean;
  timingPointsNotSupported?: boolean;
  minMaxDelayNotSupported?: boolean;
  children: ReactNode;
}

export const getChartNoDataMessage = ({
  dataExpected,
  timingPointsNotSupported,
  minMaxDelayNotSupported,
}: Omit<ChartNoDataWrapperProps, "children" | "noData">) => {
  if (dataExpected) {
    return "We have not received any vehicle location data for the time period and filters selected.";
  }

  if (timingPointsNotSupported) {
    return "The timing points filter is not supported for excess waiting time.";
  }

  if (minMaxDelayNotSupported) {
    return "The maximum early / late filters are not supported for excess waiting time.";
  }

  return "We have not found any timetable data for the time period and filters selected.";
};

export const ChartNoDataMessage = ({
  dataExpected = false,
  timingPointsNotSupported = false,
  minMaxDelayNotSupported = false,
}: Omit<ChartNoDataWrapperProps, "children" | "noData">) => {
  const errorMessage = getChartNoDataMessage({
    dataExpected,
    timingPointsNotSupported,
    minMaxDelayNotSupported,
  });

  return (
    <div className={styles.error}>
      <ExclamationInCircleIcon
        aria-hidden="true"
        className={styles.errorIcon}
      />
      <span className="chart-no-data-wrapper__error-message">
        {errorMessage}
      </span>
    </div>
  );
};

export const ChartNoDataWrapper = ({
  noData = false,
  dataExpected = false,
  timingPointsNotSupported = false,
  minMaxDelayNotSupported = false,
  children,
}: ChartNoDataWrapperProps) => {
  return (
    <div className={styles.container}>
      <div>
        {noData ? (
          <ChartNoDataMessage
            dataExpected={dataExpected}
            timingPointsNotSupported={timingPointsNotSupported}
            minMaxDelayNotSupported={minMaxDelayNotSupported}
          />
        ) : null}

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};
