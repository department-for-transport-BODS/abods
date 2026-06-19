import { memo } from "react";
import StackedHistogramChart from "@/components/on-time/StackedHistogramChart";
import { DayOfWeekData } from "@/services/on-time/on-time.service";

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

const DayOfWeekChart = ({ data }: DayOfWeekChartProps) => (
  <div data-testid="day-of-week-chart">
    <StackedHistogramChart data={data} category="dayOfWeek" centerAxis />
  </div>
);

export default memo(DayOfWeekChart);
