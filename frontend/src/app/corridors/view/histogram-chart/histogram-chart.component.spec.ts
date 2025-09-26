/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SimpleChange } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { XYChartComponent } from "../../../shared/components/amcharts/xy-chart.component";

import { chartColors } from "../../../shared/components/amcharts/chart.service";
import { HistogramChartComponent } from "./histogram-chart.component";

describe("HistogramGraphComponent", () => {
  let component: HistogramChartComponent;
  let fixture: ComponentFixture<HistogramChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistogramChartComponent, XYChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  describe("ngOnChanges", () => {
    it("should update fill and stroke color", async () => {
      const previous = chartColors.purple;
      const next = chartColors.green;
      component.ngOnChanges({
        chartFillcolor: new SimpleChange(previous, next, false),
      });

      await expect((component as any).columnSeries.stroke).toEqual(next);
      await expect((component as any).columnSeries.fill).toEqual(next);
    });

    it("should not update fill and stroke color", async () => {
      const previous = chartColors.purple;
      const next = chartColors.green;
      component.ngOnChanges({
        anotherProp: new SimpleChange(previous, next, false),
      });

      await expect((component as any).columnSeries.stroke).toBeUndefined();
      await expect((component as any).columnSeries.fill).toBeUndefined();
    });
  });
});
