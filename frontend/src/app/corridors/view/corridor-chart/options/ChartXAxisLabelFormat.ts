import { chartColors } from '../../../../shared/components/amcharts/chart.service';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartXAxisLabelFormat<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    const xAxisLabel = component.xAxis.renderer.labels.template;
    xAxisLabel.fontSize = 13;
    xAxisLabel.maxWidth = 45;
    xAxisLabel.location = 0.5;
    xAxisLabel.textAlign = 'middle';
    xAxisLabel.fill = chartColors.legendaryGrey;
  }
}
