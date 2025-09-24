/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { XYChartComponent } from "../../../shared/components/amcharts/xy-chart.component";

import { CategoryAxis, DateAxis, XYChart } from "@amcharts/amcharts4/charts";
import { SimpleChange } from "@angular/core";
import { DateTime } from "luxon";
import { CorridorGranularity, MatchType } from "../../../../generated/graphql";
import { chartColors } from "../../../shared/components/amcharts/chart.service";
import { CorridorStatsViewParams } from "../../types";
import { BoxPlotChartComponent } from "./box-plot-chart.component";

describe("BoxPlotGraphComponent", () => {
  let component: BoxPlotChartComponent;
  let fixture: ComponentFixture<BoxPlotChartComponent>;

  const fromDate = DateTime.fromISO("2022-04-15T00:00:00.000+01:00");
  const toDate = DateTime.fromISO("2022-05-13T00:00:00.000+01:00");
  let granularity: CorridorGranularity = CorridorGranularity.Day;
  const previous: CorridorStatsViewParams = {} as CorridorStatsViewParams;
  const next: CorridorStatsViewParams = {
    corridorId: "1618",
    from: fromDate,
    to: toDate,
    granularity: granularity,
    stops: [],
    matchType: MatchType.Evidenced,
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

  it("should create", async () => {
    fixture.detectChanges();

    await expect(component).toBeTruthy();
  });

  describe("ngOnChanges", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe("params change", () => {
      beforeEach(() => {
        component.xAxisType = "date";
      });

      it("should update xAxis min with from date", async () => {
        const fromMilli = fromDate.toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        await expect((component.xAxis as DateAxis).min).toEqual(fromMilli);
      });

      it("should update xAxis max with to date minus 1 day", async () => {
        granularity = CorridorGranularity.Day;
        next.granularity = granularity;
        const toMilli = toDate.minus({ day: 1 }).toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        await expect((component.xAxis as DateAxis).max).toEqual(toMilli);
      });

      it("should update xAxis max with to date minus 1 hour", async () => {
        granularity = CorridorGranularity.Hour;
        next.granularity = granularity;
        const toMilli = toDate.minus({ hour: 1 }).toMillis();
        component.ngOnChanges({
          params: new SimpleChange(previous, next, false),
        });

        await expect((component.xAxis as DateAxis).max).toEqual(toMilli);
      });
    });

    describe("whiskerFillColor change", () => {
      it("should update whiskerSeries fill to blue", async () => {
        component.ngOnChanges({
          whiskerFillColor: new SimpleChange(
            undefined,
            chartColors.blue,
            false,
          ),
        });

        await expect((component as any).whiskerSeries.fill).toEqual(
          chartColors.blue,
        );
      });

      it("should update meanSeries fill to red", async () => {
        component.ngOnChanges({
          whiskerFillColor: new SimpleChange(undefined, chartColors.red, false),
        });

        await expect((component as any).meanSeries.fill).toEqual(
          chartColors.red,
        );
      });
    });

    describe("boxFillColor change", () => {
      it("should update boxSeries fill to green", async () => {
        component.ngOnChanges({
          boxFillColor: new SimpleChange(undefined, chartColors.green, false),
        });

        await expect((component as any).boxSeries.fill).toEqual(
          chartColors.green,
        );
      });
    });

    describe("yAxisType change", () => {
      it("should hide yAxis2 and show yAxis if time", () => {
        spyOn((component as any).yAxis2, "hide");
        spyOn((component as any).yAxis2, "show");
        spyOn((component as any).yAxis, "hide");
        spyOn((component as any).yAxis, "show");
        component.ngOnChanges({
          yAxisType: new SimpleChange(undefined, "time", false),
        });

        expect((component as any).yAxis2.hide).toHaveBeenCalledWith();
        expect((component as any).yAxis2.show).not.toHaveBeenCalledWith();
        expect((component as any).yAxis.hide).not.toHaveBeenCalledWith();
        expect((component as any).yAxis.show).toHaveBeenCalledWith();
      });

      it("should show yAxis2 and hide yAxis if value", () => {
        spyOn((component as any).yAxis2, "hide");
        spyOn((component as any).yAxis2, "show");
        spyOn((component as any).yAxis, "hide");
        spyOn((component as any).yAxis, "show");
        component.ngOnChanges({
          yAxisType: new SimpleChange(undefined, "value", false),
        });

        expect((component as any).yAxis2.hide).not.toHaveBeenCalledWith();
        expect((component as any).yAxis2.show).toHaveBeenCalledWith();
        expect((component as any).yAxis.hide).toHaveBeenCalledWith();
        expect((component as any).yAxis.show).not.toHaveBeenCalledWith();
      });
    });
  });

  describe("ngAfterViewInit", () => {
    it("should set xAxis to CategoryAxis if category", () => {
      component.xAxisType = "category";
      fixture.detectChanges();

      expect(component.xAxis instanceof CategoryAxis).toBeTrue();
    });

    it("should set xAxis to DateAxis if date", () => {
      component.xAxisType = "date";
      fixture.detectChanges();

      expect(component.xAxis instanceof DateAxis).toBeTrue();
    });

    it("should center xAxis if xAxisCentered is true", async () => {
      component.xAxisCenterd = true;
      fixture.detectChanges();

      await expect(component.xAxis.align).toEqual("center");
    });

    it("should set params", async () => {
      component.params = next;
      fixture.detectChanges();

      await expect((component.xAxis as DateAxis).min).toBeTruthy();
      await expect((component.xAxis as DateAxis).max).toBeTruthy();
    });
  });

  describe("hide outliers", () => {
    beforeEach(() => {
      component.chart = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        validateData: () => {},
      } as XYChart;
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

    it("should set yAxisMinValue and yAxisMaxValue to undefined if hideOutliers is true", async () => {
      component.hideOutliers = true;
      component.ngOnChanges({
        hideOutliers: new SimpleChange(undefined, true, true),
      });

      await expect(component.data?.[0].yAxisMaxValue).toBeUndefined();
      await expect(component.data?.[0].yAxisMinValue).toBeUndefined();
      await expect(component.data?.[0].yAxisMeanValue).toEqual(7);
      await expect(component.data?.[0].maxTransitTime).toEqual(10);
      await expect(component.data?.[0].minTransitTime).toEqual(5);

      await expect(component.data?.[1].yAxisMaxValue).toBeUndefined();
      await expect(component.data?.[1].yAxisMinValue).toBeUndefined();
      await expect(component.data?.[1].yAxisMeanValue).toEqual(70);
      await expect(component.data?.[1].maxTransitTime).toEqual(100);
      await expect(component.data?.[1].minTransitTime).toEqual(50);
    });

    it("should set yAxisMinValue and yAxisMaxValue to value if hideOutliers is false", async () => {
      component.ngOnChanges({
        hideOutliers: new SimpleChange(false, true, false),
      });

      await expect(component.data?.[0].yAxisMaxValue).toEqual(10);
      await expect(component.data?.[0].yAxisMinValue).toEqual(5);
      await expect(component.data?.[0].yAxisMeanValue).toEqual(7);
      await expect(component.data?.[0].maxTransitTime).toEqual(10);
      await expect(component.data?.[0].minTransitTime).toEqual(5);

      await expect(component.data?.[1].yAxisMaxValue).toEqual(100);
      await expect(component.data?.[1].yAxisMinValue).toEqual(50);
      await expect(component.data?.[1].yAxisMeanValue).toEqual(70);
      await expect(component.data?.[1].maxTransitTime).toEqual(100);
      await expect(component.data?.[1].minTransitTime).toEqual(50);
    });
  });
});
