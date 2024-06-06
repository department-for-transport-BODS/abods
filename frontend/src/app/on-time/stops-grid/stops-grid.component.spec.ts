import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { AgGridModule } from 'ag-grid-angular';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { OnTimeService, StopPerformance } from '../on-time.service';

import { StopsGridComponent } from './stops-grid.component';
import { TimingRendererComponent } from './timing-renderer/timing-renderer.component';
import { CommonModule, PercentPipe } from '@angular/common';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OnTimeModule } from '../on-time.module';
import { ApolloTestingModule } from 'apollo-angular/testing';

describe('StopsGridComponent', () => {
  let spectator: Spectator<StopsGridComponent>;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: StopsGridComponent,
    declarations: [TimingRendererComponent],
    providers: [PercentPipe],
    imports: [
      SharedModule,
      LayoutModule,
      OnTimeModule,
      RouterTestingModule,
      CommonModule,
      FormsModule,
      AgGridModule,
      HttpClientTestingModule,
      ApolloTestingModule,
    ],
    detectChanges: false,
  });

  const stops: StopPerformance[] = [
    {
      lineId: 'LI00001',
      stopId: 'ST000000000001',
      stopInfo: {
        sourceId: '',
        stopName: 'Something road',
        stopId: 'ST000000000001',
        stopLocation: { latitude: 56.7686, longitude: 0.4567 },
        stopLocality: {
          localityId: 'L1',
          localityAreaId: 'LA1',
          localityName: 'Somewhere',
          localityAreaName: 'Some Town',
        },
      },
      scheduledDepartures: 31,
      actualDepartures: 30,
      completedRatio: 30 / 31,
      onTime: 28,
      early: 2,
      late: 0,
      total: 30,
      onTimeRatio: 28 / 30,
      earlyRatio: 2 / 30,
      lateRatio: 0,
      averageDelay: 12,
      timingPoint: false,
    },
    {
      lineId: 'LI00001',
      stopId: 'ST000000000002',
      stopInfo: {
        sourceId: '',
        stopName: 'Thingy street',
        stopId: 'ST000000000002',
        stopLocation: { latitude: 56.7686, longitude: 0.4567 },
        stopLocality: {
          localityId: 'L1',
          localityAreaId: 'LA1',
          localityName: 'Somewhere',
          localityAreaName: 'Some Town',
        },
      },
      scheduledDepartures: 29,
      actualDepartures: 27,
      completedRatio: 27 / 29,
      onTime: 26,
      early: 3,
      late: 1,
      total: 30,
      onTimeRatio: 26 / 29,
      earlyRatio: 3 / 29,
      lateRatio: 1 / 29,
      averageDelay: 44,
      timingPoint: true,
    },
  ];

  beforeEach(() => {
    spectator = createComponent();
    service = spectator.inject(OnTimeService);
  });

  it('should call service without admin area ids', () => {
    spectator.component.params = {
      fromTimestamp: DateTime.fromISO('2021-02-01T00:00:00Z').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-03-01T00:00:00Z').toJSDate(),
      filters: { nocCodes: ['NOC1'], adminAreaIds: ['AA050'] },
    };

    const spy = spyOn(service, 'fetchStopPerformanceList').and.returnValue(of(stops));
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fromTimestamp: DateTime.fromISO('2021-02-01T00:00:00Z').toJSDate(),
        toTimestamp: DateTime.fromISO('2021-03-01T00:00:00Z').toJSDate(),
        filters: { nocCodes: ['NOC1'] },
      })
    );
  });

  it('should display some data', fakeAsync(() => {
    const expected = [
      ['000000000001', '', 'Something road', '31', '96.8%', '+00:12', '93.3%', '0%', '6.7%'],
      ['000000000002', 'Timing point', 'Thingy street', '29', '93.1%', '+00:44', '89.7%', '3.4%', '10.3%'],
    ];

    spectator.component.params = {
      fromTimestamp: DateTime.fromISO('2021-02-01T00:00:00Z').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-03-01T00:00:00Z').toJSDate(),
      filters: { nocCodes: ['NOC1'] },
    };

    spyOn(service, 'fetchStopPerformanceList').and.returnValue(of(stops));

    spectator.detectChanges();
    tick(100);

    const row1 = spectator.queryAll('[role="row"][row-index="0"] [role="gridcell"]').map((e) => e.textContent?.trim());

    expect(row1).toEqual(expected[0]);

    const row2 = spectator.queryAll('[role="row"][row-index="1"] [role="gridcell"]').map((e) => e.textContent?.trim());

    expect(row2).toEqual(expected[1]);
    flush(100);
  }));

  it('should calculate summary row correctly', fakeAsync(() => {
    spectator.component.params = {
      fromTimestamp: DateTime.fromISO('2021-02-01T00:00:00Z').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-03-01T00:00:00Z').toJSDate(),
      filters: { nocCodes: ['NOC1'] },
    };

    spyOn(service, 'fetchStopPerformanceList').and.returnValue(of(stops));

    spectator.detectChanges();
    tick(100);

    const expected = ['', '', '', '60', '95%', '+00:27', '90%', '1.7%', '8.3%'];
    const summary = spectator.queryAll('[role="row"][row-index="t-0"] [role="gridcell"]').map((e) => e.textContent);

    expect(summary).toEqual(expected);

    flush(100);
  }));
});
