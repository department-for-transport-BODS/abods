import { memo } from "react";
import StackedHistogramChart from "@/components/on-time/StackedHistogramChart";
import { TimeOfDayData } from "@/services/on-time/on-time.service";

interface TimeOfDayChartProps {
  data: TimeOfDayData[];
}

const TimeOfDayChart = ({ data }: TimeOfDayChartProps) => (
  <StackedHistogramChart data={data} category="timeOfDay" />
);

export default memo(TimeOfDayChart);
