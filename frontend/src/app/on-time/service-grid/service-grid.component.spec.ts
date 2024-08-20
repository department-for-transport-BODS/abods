import { fakeAsync, flush, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { byLabel, createComponentFactory, Spectator } from '@ngneat/spectator';
import { AgGridModule } from 'ag-grid-angular';
import { BehaviorSubject } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { ServiceGridComponent } from './service-grid.component';
import { CommonModule, PercentPipe } from '@angular/common';
import { OnTimeModule } from '../on-time.module';
import { onTimeInputParams } from '../on-time.test-constants';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FrequentServicePerformance, PerformanceService } from '../performance.service';
import { OnTimeService } from '../on-time.service';
import { ApolloTestingModule } from 'apollo-angular/testing';

describe('ServiceGridComponent', () => {
  let spectator: Spectator<ServiceGridComponent>;
  let onTimeService: OnTimeService;
  let performanceService: PerformanceService;
  const listSubj = new BehaviorSubject<FrequentServicePerformance[]>([]);

  const createComponent = createComponentFactory({
    component: ServiceGridComponent,
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

  const services: FrequentServicePerformance[] = [
    {
      lineId: 'M5P',
      lineInfo: {
        serviceId: '6',
        serviceName: 'Dispear to Wear',
        serviceNumber: '1A',
      },
      scheduledDepartures: 123,
      actualDepartures: 115,
      onTime: 80,
      early: 15,
      late: 20,
      averageDelay: 12,
      total: 115,
      onTimeRatio: 80 / 115,
      lateRatio: 20 / 115,
      earlyRatio: 15 / 115,
      completedRatio: 0,
      frequent: false,
    },
    {
      lineId: 'TH',
      lineInfo: {
        serviceId: '7',
        serviceName: 'Roade to Nowerre',
        serviceNumber: '2A',
      },
      scheduledDepartures: 321,
      actualDepartures: 311,
      onTime: 300,
      early: 5,
      late: 6,
      averageDelay: 35,
      total: 311,
      onTimeRatio: 300 / 311,
      lateRatio: 6 / 311,
      earlyRatio: 5 / 311,
      completedRatio: 0,
      frequent: true,
    },
  ];

  beforeEach(() => {
    spectator = createComponent();

    onTimeService = spectator.inject(OnTimeService);
    performanceService = spectator.inject(PerformanceService);
    spyOn(performanceService, 'fetchServicePerformance').and.returnValue(listSubj.asObservable());
  });

  it('should create', () => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();

    listSubj.next(services);
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should call service', () => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();

    listSubj.next(services);
    spectator.detectChanges();

    expect(performanceService.fetchServicePerformance).toHaveBeenCalledWith(
      jasmine.objectContaining(onTimeInputParams)
    );
  });

  it('should display some data', fakeAsync(() => {
    spectator.component.params = onTimeInputParams;

    listSubj.next(services.map(onTimeService.calculateOnTimePcts));
    spectator.detectChanges();
    tick(100);

    const expectedSummary = ['', '', '444', '95.9%', '+00:29', '89.2%', '6.1%', '4.7%'];

    const expectedValues = [
      ['', '1A: Dispear to Wear', '123', '93.5%', '+00:12', '69.6%', '17.4%', '13%'],
      ['Frequent service', '2A: Roade to Nowerre', '321', '96.9%', '+00:35', '96.5%', '1.9%', '1.6%'],
    ];

    const summary = spectator.queryAll('[role="row"][row-index="t-0"] [role="gridcell"]').map((e) => e.textContent);

    expect(summary).toEqual(jasmine.arrayContaining(expectedSummary));

    const row1 = spectator.queryAll('[role="row"][row-index="0"] [role="gridcell"]').map((e) => e.textContent);

    expect(row1).toEqual(jasmine.arrayContaining(expectedValues[0]));

    const row2 = spectator.queryAll('[role="row"][row-index="1"] [role="gridcell"]').map((e) => e.textContent);

    expect(row2).toEqual(jasmine.arrayContaining(expectedValues[1]));
    flush(100);
  }));

  it('should display raw data if required', fakeAsync(() => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();
    flush(100);

    listSubj.next(services);
    spectator.detectChanges();

    const expectedSummary = ['', '426', '380', '26', '20', '444', '+00:29'];

    const expectedValues = [
      ['1A: Dispear to Wear', '115', '80', '20', '15', '123', '+00:12'],
      ['2A: Roade to Nowerre', '311', '300', '6', '5', '321', '+00:35'],
    ];

    spectator.click(byLabel('Count'));

    spectator.detectChanges();
    flush(100);

    // expect(component.mode).toEqual('count');
    const summary = spectator.queryAll('[role="row"][row-index="t-0"] [role="gridcell"]').map((e) => e.textContent);

    expect(summary).toEqual(jasmine.arrayContaining(expectedSummary));

    const row1 = spectator.queryAll('[role="row"][row-index="0"] [role="gridcell"]').map((e) => e.textContent);

    expect(row1).toEqual(jasmine.arrayContaining(expectedValues[0]));

    const row2 = spectator.queryAll('[role="row"][row-index="1"] [role="gridcell"]').map((e) => e.textContent);

    expect(row2).toEqual(jasmine.arrayContaining(expectedValues[1]));
  }));
});
