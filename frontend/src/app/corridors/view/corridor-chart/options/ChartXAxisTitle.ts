import { SimpleChanges } from '@angular/core';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartXAxisTitle<TDataType> implements BaseChartOption<TDataType> {
  onChanges(changes: SimpleChanges, component: CorridorChart<TDataType>): void {
    if (changes.xAxisTitle && component.xAxis) {
      component.xAxis.title.text = changes.xAxisTitle.currentValue;
    }
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    component.xAxis.title.text = component.xAxisTitle ? component.xAxisTitle : '';
  }
}
