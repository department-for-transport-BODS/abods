import { Container } from '@amcharts/amcharts4/core';
import { SimpleChanges } from '@angular/core';
import { loadingSpinner } from '../../../../shared/components/amcharts/chart.service';
import { BaseChartOption } from '../BaseChartOption';
import { CorridorChart } from '../CorridorChart';

export class ChartLoadingScreen<TDataType> implements BaseChartOption<TDataType> {
  loadingScreen?: Container;

  onChanges(changes: SimpleChanges): void {
    if (changes.loading && this.loadingScreen) {
      changes.loading.currentValue ? this.loadingScreen.show() : this.loadingScreen.hide();
    }
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    this.loadingScreen = component.chart.tooltipContainer?.createChild(Container);
    if (this.loadingScreen) {
      loadingSpinner(this.loadingScreen);
      component.loading ? this.loadingScreen.show(0) : this.loadingScreen.hide(0);
    }
  }
}
