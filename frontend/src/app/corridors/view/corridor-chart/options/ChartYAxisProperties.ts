import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartYAxisProperties<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    component.yAxis.renderer.baseGrid.disabled = false;
  }
}
