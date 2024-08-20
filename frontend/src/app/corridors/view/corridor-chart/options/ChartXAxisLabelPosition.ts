import { SimpleChanges } from '@angular/core';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartXAxisLabelPosition<TDataType> implements BaseChartOption<TDataType> {
  onChanges(changes: SimpleChanges, component: CorridorChart<TDataType>): void {
    if (changes.xAxisLabelPosition && component.xAxis) {
      component.xAxisLabelPosition = changes.xAxisLabelPosition.currentValue;
      this.setXAxisLabelPosition(component);
    }
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    this.setXAxisLabelPosition(component);
  }

  private setXAxisLabelPosition(component: CorridorChart<TDataType>) {
    const xAxis = component.xAxis;
    const xAxisLabel = xAxis.renderer.labels.template;
    if (component.xAxisLabelPosition === 'bin') {
      // Deliberately cut off last cell
      xAxis.endLocation = 0.05;
      xAxisLabel.location = 0;
    } else {
      xAxisLabel.location = 0.5;
    }
  }
}
