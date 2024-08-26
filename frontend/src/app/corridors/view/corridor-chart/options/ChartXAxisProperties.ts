import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartXAxisProperties<TDataType> implements BaseChartOption<TDataType> {
  afterViewInit(component: CorridorChart<TDataType>): void {
    component.xAxis.renderer.minGridDistance = 40;
    component.xAxis.renderer.line.strokeOpacity = 0.15;
  }
}
