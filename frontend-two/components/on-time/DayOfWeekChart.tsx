import { memo } from "react";
import StackedHistogramChart from "@/components/on-time/StackedHistogramChart";
import { DayOfWeekData } from "@/services/on-time/on-time.service";

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

const DayOfWeekChart = ({ data }: DayOfWeekChartProps) => (
  <StackedHistogramChart data={data} category="dayOfWeek" centerAxis />
);

export default memo(DayOfWeekChart);
