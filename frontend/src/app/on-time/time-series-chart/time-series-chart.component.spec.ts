import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { Granularity } from 'src/generated/graphql';
import { OnTimeService } from '../on-time.service';

import { TimeSeriesChartComponent } from './time-series-chart.component';
import {
  onTimeInputParams,
  onTimeInputParamsAlt,
  onTimeInputParamsAltTs,
  onTimeInputParamsTimingPointFalse,
  onTimeInputParamsTimingPointTrue,
} from '../on-time.test-constants';
import { DateTime } from 'luxon';

describe('TimeSeriesChartComponent', () => {
  let spectator: Spectator<TimeSeriesChartComponent>;
  let component: TimeSeriesChartComponent;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: TimeSeriesChartComponent,
    imports: [LayoutModule, SharedModule, ApolloTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(OnTimeService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should request data', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimeTimeSeriesData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ ...onTimeInputParams, filters: { ...onTimeInputParams.filters, granularity: 'day' } })
    );
  });

  it('should request hour granularity data if time period short enough', () => {
    const from = DateTime.fromISO('2021-01-01T00:00:00+00:00');
    const to = DateTime.fromISO('2021-01-06T00:00:00+00:00');

    component.params = {
      fromTimestamp: from,
      toTimestamp: to,
      filters: {},
    };

    const spy = spyOn(service, 'fetchOnTimeTimeSeriesData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fromTimestamp: from,
        toTimestamp: to,
        filters: { granularity: Granularity.Hour },
      })
    );
  });

  it('should re-request data if nocCode changes', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimeTimeSeriesData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ ...onTimeInputParams, filters: { ...onTimeInputParams.filters, granularity: 'day' } })
    );

    spy.calls.reset();

    component.params = onTimeInputParamsAlt;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ...onTimeInputParamsAlt,
        filters: { ...onTimeInputParamsAlt.filters, granularity: 'day' },
      })
    );
  });

  it('should re-request data if dates change', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimeTimeSeriesData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ ...onTimeInputParams, filters: { ...onTimeInputParams.filters, granularity: 'day' } })
    );

    spy.calls.reset();

    component.params = onTimeInputParamsAltTs;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ...onTimeInputParamsAltTs,
        filters: { ...onTimeInputParamsAltTs.filters, granularity: 'day' },
      })
    );
  });

  it('should re-request data if timing points filter changes', () => {
    component.params = onTimeInputParamsTimingPointFalse;

    const spy = spyOn(service, 'fetchOnTimeTimeSeriesData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ...onTimeInputParamsTimingPointFalse,
        filters: { ...onTimeInputParamsTimingPointFalse.filters, granularity: 'day' },
      })
    );

    spy.calls.reset();

    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ...onTimeInputParamsTimingPointTrue,
        filters: { ...onTimeInputParamsTimingPointTrue.filters, granularity: 'day' },
      })
    );
  });
});
