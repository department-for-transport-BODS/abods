import { SimpleChanges } from '@angular/core';
import { CorridorChart } from './CorridorChart';
import {
  ChartDisableXAxisTooltip,
  ChartDisableYAxisTooltip,
  ChartLoadingScreen,
  ChartNoDataScreen,
  ChartPaddingRight,
  ChartXAxisLabelFormat,
  ChartXAxisLabelPosition,
  ChartXAxisProperties,
  ChartXAxisTitle,
  ChartYAxisLabelFormat,
  ChartYAxisProperties,
  ChartYAxisTitle,
  ChartZoomOutButtonDisbled,
} from './options';

export interface BaseChartOption<TDataType> {
  onChanges?(changes: SimpleChanges, component?: CorridorChart<TDataType>): void;
  afterViewInit(component: CorridorChart<TDataType>): void;
}

export class BaseChartOptions<TDataType> {
  options: BaseChartOption<TDataType>[] = [];

  builder(): BaseChartOptionsBuilder<TDataType> {
    return new BaseChartOptionsBuilder<TDataType>(this);
  }

  onChanges(changes: SimpleChanges, component: CorridorChart<TDataType>): void {
    this.options.forEach((option: BaseChartOption<TDataType>) => {
      if (option.onChanges) {
        option.onChanges(changes, component);
      }
    });
  }

  afterViewInit(component: CorridorChart<TDataType>): void {
    this.options.forEach((option) => option.afterViewInit(component));
  }
}

class BaseChartOptionsBuilder<TDataType> {
  private ops: BaseChartOptions<TDataType>;

  constructor(options: BaseChartOptions<TDataType>) {
    this.ops = options;
  }

  build(): BaseChartOptions<TDataType> {
    return this.ops;
  }

  loadingScreen(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartLoadingScreen());
    return this;
  }

  noDataScreen(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartNoDataScreen());
    return this;
  }

  yAxisTitle(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartYAxisTitle());
    return this;
  }

  xAxisTitle(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartXAxisTitle());
    return this;
  }

  xAxisLabelFormat(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartXAxisLabelFormat());
    return this;
  }

  yAxisLabelFormat(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartYAxisLabelFormat());
    return this;
  }

  disableYAxisTooltip(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartDisableYAxisTooltip());
    return this;
  }

  disableXAxisTooltip(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartDisableXAxisTooltip());
    return this;
  }

  paddingRight(padding?: number) {
    this.ops.options.push(new ChartPaddingRight(padding));
    return this;
  }

  xAxisProperties(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartXAxisProperties());
    return this;
  }

  yAxisProperties(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartYAxisProperties());
    return this;
  }

  xAxisLabelPosition(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartXAxisLabelPosition());
    return this;
  }

  zoomOutButtonDisbled(): BaseChartOptionsBuilder<TDataType> {
    this.ops.options.push(new ChartZoomOutButtonDisbled());
    return this;
  }
}
