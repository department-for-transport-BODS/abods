import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XYChartComponent } from '../../../shared/components/amcharts/xy-chart.component';

import { HistogramChartComponent } from './histogram-chart.component';
import { chartColors } from '../../../shared/components/amcharts/chart.service';

describe('HistogramGraphComponent', () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should update fill and stroke color', () => {
      const previous = chartColors.purple;
      const next = chartColors.green;
      component.ngOnChanges({
        chartFillcolor: new SimpleChange(previous, next, false),
      });

      expect(component['columnSeries'].stroke).toEqual(next);
      expect(component['columnSeries'].fill).toEqual(next);
    });

    it('should not update fill and stroke color', () => {
      const previous = chartColors.purple;
      const next = chartColors.green;
      component.ngOnChanges({
        anotherProp: new SimpleChange(previous, next, false),
      });

      expect(component['columnSeries'].stroke).toBeUndefined();
      expect(component['columnSeries'].fill).toBeUndefined();
    });
  });
});
