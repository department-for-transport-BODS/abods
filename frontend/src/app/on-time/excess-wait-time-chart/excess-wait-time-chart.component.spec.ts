import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { SharedModule } from '../../shared/shared.module';
import { ExcessWaitTimeChartComponent } from './excess-wait-time-chart.component';
import { DateTime } from 'luxon';
import { DateAxis } from '@amcharts/amcharts4/charts';
import { List } from '@amcharts/amcharts4/core';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { HeadwayService } from '../headway.service';
import { of } from 'rxjs';

describe('ExcessWaitTimeChartComponent', () => {
  let spectator: Spectator<ExcessWaitTimeChartComponent>;
  let headwayService: HeadwayService;

  const createComponent = createComponentFactory({
    component: ExcessWaitTimeChartComponent,
    imports: [SharedModule, ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();

    headwayService = spectator.inject(HeadwayService);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should set min and max dates', () => {
    spyOn(headwayService, 'fetchTimeSeries').and.returnValue(of([]));
    spectator.component.params = {
      fromTimestamp: DateTime.fromISO('2022-02-21'),
      toTimestamp: DateTime.fromISO('2022-03-21'),
      filters: { nocCodes: ['SCEM'], lineIds: ['LI12345'] },
    };
    spectator.detectChanges();

    const [xAxis] = spectator.component.chart.xAxes as List<DateAxis>;

    expect(xAxis.min).toEqual(DateTime.fromISO('2022-02-21').toMillis());
    expect(xAxis.max).toEqual(DateTime.fromISO('2022-03-20').toMillis()); // Minus one day
  });
});
