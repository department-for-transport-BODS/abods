import { SimpleChanges } from '@angular/core';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartYAxisTitle<TDataType> implements BaseChartOption<TDataType> {
  onChanges(changes: SimpleChanges, component: CorridorChart<TDataType>): void {
    if (changes.yAxisTitle && component.yAxis) {
      component.yAxis.title.text = changes.yAxisTitle.currentValue;
    }
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    component.yAxis.title.text = component.yAxisTitle ? component.yAxisTitle : '';
  }
}
