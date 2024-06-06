import { Container } from '@amcharts/amcharts4/core';
import { SimpleChanges } from '@angular/core';
import { messageScreen } from '../../../../shared/components/amcharts/chart.service';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartNoDataScreen<TDataType> implements BaseChartOption<TDataType> {
  noDataScreen?: Container;

  onChanges(changes: SimpleChanges): void {
    if (changes.noData && this.noDataScreen) {
      changes.noData.currentValue ? this.noDataScreen.show() : this.noDataScreen.hide();
    }
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    this.noDataScreen = component.chart.tooltipContainer?.createChild(Container);
    if (this.noDataScreen) {
      messageScreen(this.noDataScreen, 'warn', 'No data');
      component.noData ? this.noDataScreen.show(0) : this.noDataScreen.hide(0);
    }
  }
}
