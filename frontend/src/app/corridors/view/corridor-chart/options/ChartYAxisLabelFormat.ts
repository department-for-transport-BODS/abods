import { chartColors } from '../../../../shared/components/amcharts/chart.service';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartYAxisLabelFormat<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    const yAxisLabel = component.yAxis.renderer.labels.template;
    yAxisLabel.fontSize = 13;
    yAxisLabel.maxWidth = 40;
    yAxisLabel.fill = chartColors.legendaryGrey;
  }
}
