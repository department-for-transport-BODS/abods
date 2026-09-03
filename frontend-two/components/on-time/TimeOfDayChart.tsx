import { memo } from "react";
import StackedHistogramChart from "@/components/on-time/StackedHistogramChart";
import { TimeOfDayData } from "@/services/on-time/on-time.service";

interface TimeOfDayChartProps {
  data: TimeOfDayData[];
}

const TimeOfDayChart = ({ data }: TimeOfDayChartProps) => (
  <div data-testid="time-of-day-chart">
    <StackedHistogramChart data={data} category="timeOfDay" />
  </div>
);

export default memo(TimeOfDayChart);
