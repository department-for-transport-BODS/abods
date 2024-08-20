import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { XYChart } from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import {
  Component,
  ElementRef,
  forwardRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am4themes_frozen from '@amcharts/amcharts4/themes/frozen';
import am4themes_microchart from '@amcharts/amcharts4/themes/microchart';
import { ReplaySubject } from 'rxjs';
import { isNotNullOrUndefined } from '../../rxjs-operators';

am4core.options.autoSetClassName = true; // enables classnames

const SUPPORTED_THEMES = {
  animated: am4themes_animated,
  frozen: am4themes_frozen,
  microchart: am4themes_microchart,
};

export type AM4Theme = keyof typeof SUPPORTED_THEMES;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'am4-xy-chart',
  template: ``,
  styles: [':host { display: block }'],
  providers: [
    {
      provide: XYChart,
      useFactory: (component: XYChartComponent) => component.chartRef,
      deps: [forwardRef(() => XYChartComponent)],
    },
  ],
})
export class XYChartComponent implements OnInit, OnDestroy {
  private chart!: XYChart;
  private data$ = new ReplaySubject<unknown[]>(1);

  @Input() theme: AM4Theme = 'animated';

  @Input() set data(data: unknown[] | null | undefined) {
    if (isNotNullOrUndefined(data)) {
      this.data$.next(data);
    }
  }

  get chartRef() {
    return this.chart;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(@Inject(PLATFORM_ID) private platformId: object, private zone: NgZone, private elementRef: ElementRef) {}

  ngOnInit() {
    this.browserOnly(() => {
      am4core.unuseAllThemes();
      am4core.useTheme(SUPPORTED_THEMES[this.theme]);
      this.chart = am4core.create(this.elementRef.nativeElement, am4charts.XYChart);
      this.data$.subscribe((data) => (this.chart.data = data));
    });
  }

  ngOnDestroy() {
    this.browserOnly(() => {
      this.chart.dispose();
    });
    this.data$.complete();
  }

  browserOnly(callback: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => callback());
    }
  }
}
