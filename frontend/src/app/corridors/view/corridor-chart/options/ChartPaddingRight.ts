import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartPaddingRight<TDataType> implements BaseChartOption<TDataType> {
  private paddingRight!: number;
  constructor(paddingRight = 20) {
    this.paddingRight = paddingRight;
  }
  afterViewInit(component: CorridorChart<TDataType>): void {
    component.chart.paddingRight = this.paddingRight;
  }
}
