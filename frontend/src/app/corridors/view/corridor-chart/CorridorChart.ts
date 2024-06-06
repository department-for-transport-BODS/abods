import { Axis, XYChart } from '@amcharts/amcharts4/charts';

export type XAxisLabelPosition = 'bin' | 'column';

export interface CorridorChart<TDataType> {
  data?: TDataType;
  loading?: boolean;
  noData?: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
  xAxisLabelPosition?: XAxisLabelPosition;
  chart: XYChart;
  xAxis: Axis;
  yAxis: Axis;
}
