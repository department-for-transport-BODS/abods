import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartDisableXAxisTooltip<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    if (component.xAxis.tooltip) {
      component.xAxis.tooltip.disabled = true;
    }
  }
}
