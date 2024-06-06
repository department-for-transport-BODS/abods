import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartDisableYAxisTooltip<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    if (component.yAxis.tooltip) {
      component.yAxis.tooltip.disabled = true;
    }
  }
}
