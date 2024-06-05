import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';

import * as am4core from '@amcharts/amcharts4/core';
import { Circle, color, create, LinearGradient, percent } from '@amcharts/amcharts4/core';
import { Bullet, DateAxis, LineSeries, ValueAxis, XYChart } from '@amcharts/amcharts4/charts';
import am4themes_microchart from '@amcharts/amcharts4/themes/microchart';
import { Observable, Subject } from 'rxjs';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';
import { TimeSeriesData } from '../../on-time.service';
import { map, mergeMap } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Interval } from 'luxon';

@Component({
  selector: 'app-sparkline-factory',
  template: '',
  styles: [':host { display: block; position: absolute; width: 350px; height: 60px; top: -1999px; }'],
})
export class SparklineFactoryComponent extends BaseChart implements AfterViewInit, OnDestroy {
  private dateAxis!: DateAxis;

  constructor(chartService: ChartService, private elementRef: ElementRef, private domSanitizer: DomSanitizer) {
    super(am4themes_microchart, chartService);
  }

  renderStatic(data: TimeSeriesData[], interval: Interval): Observable<SafeHtml> {
    const rendered$ = new Subject<void>();

    this.dateAxis.min = interval.start.toMillis();
    this.dateAxis.max = interval.end.toMillis();

    this.chart.data = data;
    this.chart.events.once('dataitemsvalidated', () => {
      const disposer = am4core.registry.events.on('exitframe', () => {
        if (am4core.registry.invalidSprites[this.chart.uid]?.length) {
          return;
        }
        rendered$.next();
        rendered$.complete();
        disposer.dispose();
      });
    });

    return rendered$.asObservable().pipe(
      mergeMap(() => this.chart.exporting.getSVG('svg', {}, false)),
      map((svg) => this.domSanitizer.bypassSecurityTrustHtml(svg))
    );
  }

  ngAfterViewInit() {
    this.chartService.browserOnly(() => this.renderChart());
  }

  createChart() {
    this.chart = create(this.elementRef.nativeElement, XYChart);
    this.chart.colors.list = this.chartService.chartColorList;
    this.chart.fontFamily = this.chartService.getFontFamily();
    this.chart.width = percent(100);
    this.chart.height = 60;
    this.chart.padding(2, 2, 2, 2);
    this.chart.margin(0, 0, 0, 0);
    this.chart.dateFormatter.inputDateFormat = 'yyyy-MM-ddTHH:mm:ss';

    this.dateAxis = this.chart.xAxes.push(new DateAxis());
    this.dateAxis.startLocation = 0.5;
    this.dateAxis.endLocation = 0.5;

    const valueAxis = this.chart.yAxes.push(new ValueAxis());
    valueAxis.min = 0;
    valueAxis.max = 1;
    valueAxis.renderer.baseGrid.disabled = false;

    const series = this.chart.series.push(new LineSeries());
    series.dataFields.valueY = 'onTimeRatio';
    series.dataFields.dateX = 'ts';
    series.stroke = this.chartService.colorMap.purple;
    series.strokeWidth = 1;
    series.fillOpacity = 0.2;
    series.mainContainer.mask = undefined;
    series.connect = false;

    const bullet = series.bullets.push(new Bullet());
    const circle = bullet.createChild(Circle);
    circle.fill = this.chartService.colorMap.purple;
    circle.width = 3;
    circle.height = 3;
    circle.strokeWidth = 0;
    this.chart.maskBullets = false;

    const gradient = new LinearGradient();
    gradient.addColor(color('#6A3D9A'));
    gradient.addColor(this.chartService.colorMap.white);
    gradient.rotation = 90;
    series.fill = gradient;
  }

  ngOnDestroy() {
    this.chartService.browserOnly(() => {
      this.chart.dispose();
    });
  }
}
