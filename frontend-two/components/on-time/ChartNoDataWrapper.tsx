import { ReactNode } from "react";
import ExclamationInCircleIcon from "@/assets/icons/exclamation-in-circle.svg";

interface ChartNoDataWrapperProps {
  noData?: boolean;
  dataExpected?: boolean;
  timingPointsNotSupported?: boolean;
  minMaxDelayNotSupported?: boolean;
  children: ReactNode;
}

const getErrorMessage = ({
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

export const ChartNoDataWrapper = ({
  noData = false,
  dataExpected = false,
  timingPointsNotSupported = false,
  minMaxDelayNotSupported = false,
  children,
}: ChartNoDataWrapperProps) => {
  const errorMessage = getErrorMessage({
    dataExpected,
    timingPointsNotSupported,
    minMaxDelayNotSupported,
  });

  return (
    <div className="chart-no-data-wrapper">
      <div>
        {noData ? (
          <div className="chart-no-data-wrapper__error">
            <ExclamationInCircleIcon
              aria-hidden="true"
              className="chart-no-data-wrapper__error-icon"
            />
            <span className="chart-no-data-wrapper__error-message">
              {errorMessage}
            </span>
          </div>
        ) : null}

        <div className="chart-no-data-wrapper__content">{children}</div>
      </div>
    </div>
  );
};
