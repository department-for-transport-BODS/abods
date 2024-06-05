import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { ChartService } from './chart.service';
import { AsyncStatus } from '../../../on-time/pending.model';
import { ITheme } from '@amcharts/amcharts4/core';

export class BaseChart {
  protected screens: { [k: string]: am4core.Container } = {};

  protected chart!: am4charts.XYChart;

  constructor(protected theme: ITheme, protected chartService: ChartService) {}

  set asyncStatus(status: AsyncStatus) {
    if (status === 'complete') {
      this.screens.loadingScreen?.hide();
    } else if (status === 'loading') {
      this.screens.errorScreen?.hide();
      this.screens.noDataScreen?.hide();
      this.showLoadingScreen();
    } else if (status === 'error') {
      this.showErrorMessage();
    }
  }

  ensureTheme() {
    am4core.unuseAllThemes();
    am4core.useTheme(this.theme);
  }

  createChart(): void {
    // Do nothing
  }

  renderChart(): void {
    this.ensureTheme();
    this.createChart();
  }

  showMessage(screen: string, create: (noDataScreen?: am4core.Container) => void) {
    if (!this.screens[screen]) {
      if (this.chart?.tooltipContainer) {
        const container = this.chart.tooltipContainer.createChild(am4core.Container);
        create(container);
        this.screens[screen] = container;
      }
    }
    this.screens[screen]?.show();
  }

  showLoadingScreen() {
    this.showMessage('loadingScreen', (o) => this.chartService.getSpinnerObject(o));
  }

  showErrorMessage() {
    this.showMessage('errorScreen', (o) => this.chartService.getErrorObject(o));
  }
}
