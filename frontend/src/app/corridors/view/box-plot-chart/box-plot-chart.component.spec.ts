import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XYChartComponent } from '../../../shared/components/amcharts/xy-chart.component';

import { BoxPlotChartComponent } from './box-plot-chart.component';
import { CorridorStatsViewParams } from '../../corridors.service';
import { SimpleChange } from '@angular/core';
import { DateTime } from 'luxon';
import { CorridorGranularity } from '../../../../generated/graphql';
import { chartColors } from '../../../shared/components/amcharts/chart.service';
import { CategoryAxis, DateAxis, XYChart } from '@amcharts/amcharts4/charts';

describe('BoxPlotGraphComponent', () => {
  let component: BoxPlotChartComponent;
  let fixture: ComponentFixture<BoxPlotChartComponent>;

  const fromDate = DateTime.fromISO('2022-04-15T00:00:00.000+01:00');
  const toDate = DateTime.fromISO('2022-05-13T00:00:00.000+01:00');
  let granularity: CorridorGranularity = CorridorGranularity.Day;
  const previous = <CorridorStatsViewParams>{};
  const next = <CorridorStatsViewParams>{
    corridorId: '1618',
    from: fromDate,
    to: toDate,
    granularity: granularity,
    stops: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BoxPlotChartComponent, XYChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxPlotChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('params change', () => {
      beforeEach(() => {
        component.xAxisType = 'date';
      });

      it('should update xAxis min with from date', () => {
        const fromMilli = fromDate.toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        expect((component.xAxis as DateAxis).min).toEqual(fromMilli);
      });

      it('should update xAxis max with to date minus 1 day', () => {
        granularity = CorridorGranularity.Day;
        next.granularity = granularity;
        const toMilli = toDate.minus({ day: 1 }).toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        expect((component.xAxis as DateAxis).max).toEqual(toMilli);
      });

      it('should update xAxis max with to date minus 1 hour', () => {
        granularity = CorridorGranularity.Hour;
        next.granularity = granularity;
        const toMilli = toDate.minus({ hour: 1 }).toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        expect((component.xAxis as DateAxis).max).toEqual(toMilli);
      });
    });

    describe('whiskerFillColor change', () => {
      it('should update whiskerSeries fill to blue', () => {
        component.ngOnChanges({
          whiskerFillColor: new SimpleChange(undefined, chartColors.blue, false),
        });

        expect(component['whiskerSeries'].fill).toEqual(chartColors.blue);
      });

      it('should update meanSeries fill to red', () => {
        component.ngOnChanges({
          whiskerFillColor: new SimpleChange(undefined, chartColors.red, false),
        });

        expect(component['meanSeries'].fill).toEqual(chartColors.red);
      });
    });

    describe('boxFillColor change', () => {
      it('should update boxSeries fill to green', () => {
        component.ngOnChanges({
          boxFillColor: new SimpleChange(undefined, chartColors.green, false),
        });

        expect(component['boxSeries'].fill).toEqual(chartColors.green);
      });
    });

    describe('yAxisType change', () => {
      it('should hide yAxis2 and show yAxis if time', () => {
        spyOn(component['yAxis2'], 'hide');
        spyOn(component['yAxis2'], 'show');
        spyOn(component['yAxis'], 'hide');
        spyOn(component['yAxis'], 'show');
        component.ngOnChanges({
          yAxisType: new SimpleChange(undefined, 'time', false),
        });

        expect(component['yAxis2'].hide).toHaveBeenCalledWith();
        expect(component['yAxis2'].show).not.toHaveBeenCalledWith();
        expect(component.yAxis.hide).not.toHaveBeenCalledWith();
        expect(component.yAxis.show).toHaveBeenCalledWith();
      });

      it('should show yAxis2 and hide yAxis if value', () => {
        spyOn(component['yAxis2'], 'hide');
        spyOn(component['yAxis2'], 'show');
        spyOn(component['yAxis'], 'hide');
        spyOn(component['yAxis'], 'show');
        component.ngOnChanges({
          yAxisType: new SimpleChange(undefined, 'value', false),
        });

        expect(component['yAxis2'].hide).not.toHaveBeenCalledWith();
        expect(component['yAxis2'].show).toHaveBeenCalledWith();
        expect(component.yAxis.hide).toHaveBeenCalledWith();
        expect(component.yAxis.show).not.toHaveBeenCalledWith();
      });
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set xAxis to CategoryAxis if category', () => {
      component.xAxisType = 'category';
      fixture.detectChanges();

      expect(component.xAxis instanceof CategoryAxis).toBeTrue();
    });

    it('should set xAxis to DateAxis if date', () => {
      component.xAxisType = 'date';
      fixture.detectChanges();

      expect(component.xAxis instanceof DateAxis).toBeTrue();
    });

    it('should center xAxis if xAxisCentered is true', () => {
      component.xAxisCenterd = true;
      fixture.detectChanges();

      expect(component.xAxis.align).toEqual('center');
    });

    it('should set params', () => {
      component.params = next;
      fixture.detectChanges();

      expect((component.xAxis as DateAxis).min).toBeTruthy();
      expect((component.xAxis as DateAxis).max).toBeTruthy();
    });
  });

  describe('hide outliers', () => {
    beforeEach(() => {
      component.chart = <XYChart>{
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        validateData: () => {},
      };
      component.data = [
        {
          yAxisMinValue: 5,
          yAxisMaxValue: 10,
          yAxisMeanValue: 7,
          maxTransitTime: 10,
          minTransitTime: 5,
        },
        {
          yAxisMinValue: 50,
          yAxisMaxValue: 100,
          yAxisMeanValue: 70,
          maxTransitTime: 100,
          minTransitTime: 50,
        },
      ];
    });

    it('should set yAxisMinValue and yAxisMaxValue to undefined if hideOutliers is true', () => {
      component.hideOutliers = true;
      component.ngOnChanges({ hideOutliers: new SimpleChange(undefined, true, true) });

      expect(component.data?.[0].yAxisMaxValue).toBeUndefined();
      expect(component.data?.[0].yAxisMinValue).toBeUndefined();
      expect(component.data?.[0].yAxisMeanValue).toEqual(7);
      expect(component.data?.[0].maxTransitTime).toEqual(10);
      expect(component.data?.[0].minTransitTime).toEqual(5);

      expect(component.data?.[1].yAxisMaxValue).toBeUndefined();
      expect(component.data?.[1].yAxisMinValue).toBeUndefined();
      expect(component.data?.[1].yAxisMeanValue).toEqual(70);
      expect(component.data?.[1].maxTransitTime).toEqual(100);
      expect(component.data?.[1].minTransitTime).toEqual(50);
    });

    it('should set yAxisMinValue and yAxisMaxValue to value if hideOutliers is false', () => {
      component.ngOnChanges({ hideOutliers: new SimpleChange(false, true, false) });

      expect(component.data?.[0].yAxisMaxValue).toEqual(10);
      expect(component.data?.[0].yAxisMinValue).toEqual(5);
      expect(component.data?.[0].yAxisMeanValue).toEqual(7);
      expect(component.data?.[0].maxTransitTime).toEqual(10);
      expect(component.data?.[0].minTransitTime).toEqual(5);

      expect(component.data?.[1].yAxisMaxValue).toEqual(100);
      expect(component.data?.[1].yAxisMinValue).toEqual(50);
      expect(component.data?.[1].yAxisMeanValue).toEqual(70);
      expect(component.data?.[1].maxTransitTime).toEqual(100);
      expect(component.data?.[1].minTransitTime).toEqual(50);
    });
  });
});
