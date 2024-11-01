import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Granularity, VehicleStatsType } from 'src/generated/graphql';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_microchart from '@amcharts/amcharts4/themes/microchart';
import { from, of, Subject, Subscription } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { parseSync, stringify } from 'svgson';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';

@Component({
  selector: 'app-feed-monitoring-sparkline-cell-template',
  template: '<div class="vehicle-sparkline-template" [id]="chartId"></div>',
  styleUrls: ['./sparkline-cell-template.component.scss'],
})
export class SparklineCellTemplateComponent extends BaseChart implements AfterViewInit, OnDestroy {
  chartId = 'vehicle-sparkline-template';

  processingQueue = new Subject<{ data: VehicleStatsType[]; callback: (svg: string) => void }>();
  subs: Subscription[] = [];

  constructor(protected chartService: ChartService) {
    super(am4themes_microchart, chartService);
  }

  private renderedCharts = new Map<VehicleStatsType[], string>();

  ngAfterViewInit() {
    this.chartService.browserOnly(() => this.renderChart());

    this.subs.push(
      this.processingQueue
        .pipe(
          filter(({ data }) => data && data.some(({ actual }) => actual && actual > 0)),
          concatMap(({ data, callback }) => {
            if (this.renderedCharts.has(data)) {
              callback(this.renderedCharts.get(data) as string);
              return of();
            }
            return from(
              new Promise<void>((complete) => {
                this.createStaticImageAndCallback(data, (svg) => {
                  this.renderedCharts.set(data, svg);
                  callback(svg);
                  complete();
                });
              })
            );
          })
        )
        .subscribe()
    );
  }

  createImage(callback: (svg: string) => void) {
    if (!this.chart) {
      return;
    }
    const invalidSprites = am4core.registry.invalidSprites[this.chart.uid];

    if (invalidSprites && invalidSprites.length) {
      am4core.registry.events.once('exitframe', () => {
        this.createImage(callback);
      });
    } else {
      am4core.registry.events.once('exitframe', () => {
        if (!this.chart) {
          return;
        }
        try {
          this.chart.exporting.getSVG('svg', {}, false).then((svg) => {
            const svgson = parseSync(svg);
            svgson.attributes.width = '100%';
            svgson.attributes.preserveAspectRatio = 'none';
            callback(stringify(svgson));
          });
        } catch {
          console.warn('Failed to export the SVG; this is likely due to the template being disposed of early');
        }
      });
    }
  }

  createStaticImage(data: VehicleStatsType[], callback: (svg: string) => void) {
    this.processingQueue.next({ data, callback });
  }

  createStaticImageAndCallback(withData: VehicleStatsType[], callback: (svg: string) => void) {
    if (!this.chart) {
      return;
    }

    this.chart.data = this.cleanUpData(withData);
    this.chart.events.once('dataitemsvalidated', () => {
      this.createImage(callback);
    });
  }

  private cleanUpData(withData: VehicleStatsType[]) {
    const protoViewData = withData.map((stat) => {
      const dateTime = DateTime.fromISO(stat.timestamp, { zone: 'utc' });
      return {
        dateTime,
        timestamp: dateTime.toJSDate(),
        actual: stat.actual,
      };
    });

    protoViewData.sort(({ dateTime: dateTime1 }, { dateTime: dateTime2 }) => (dateTime1 < dateTime2 ? -1 : 1));

    const minDateTime = protoViewData[0].dateTime;
    const maxDateTime = protoViewData[protoViewData.length - 1].dateTime;

    const viewData: VehicleStatsType[] = [];

    let i = 0;
    for (let ts = minDateTime; ts <= maxDateTime; ts = ts.plus({ hours: 1 })) {
      const candidateStat = protoViewData[i];
      if (candidateStat.dateTime.equals(ts)) {
        viewData.push(candidateStat);
        i += 1;
      } else {
        viewData.push({
          timestamp: ts.toJSDate(),
          actual: 0,
        });
      }
    }
    return viewData;
  }

  createDateAxis() {
    if (!this.chart) {
      return;
    }

    const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.startLocation = 0.5;
    dateAxis.endLocation = 0.5;
    dateAxis.baseInterval = {
      timeUnit: Granularity.Hour,
      count: 1,
    };
  }

  createValueAxis() {
    if (!this.chart) {
      return;
    }
    this.chart.yAxes.push(new am4charts.ValueAxis());
  }

  createActualSeries() {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.LineSeries());
    series.name = 'Actual';
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = 'actual';
    series.stroke = this.chart.colors.getIndex(0);
    series.fill = this.chart.colors.getIndex(0);
    series.fillOpacity = 1;
    series.tensionX = 0.8;

    return series;
  }

  createChart() {
    this.chart = am4core.create(this.chartId, am4charts.XYChart);
    this.chart.colors.list = this.chartService.chartColorList;
    this.chart.fontFamily = this.chartService.getFontFamily();
    this.chart.width = am4core.percent(100);
    this.chart.background.fill = am4core.color('#F8F8F8');
    this.chart.height = 37;
    this.chart.padding(0, 0, 0, 0);
    this.chart.margin(0, 0, 0, 0);

    this.createDateAxis();
    this.createValueAxis();

    this.createActualSeries();
  }

  ngOnDestroy() {
    this.chartService.browserOnly(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }
}
