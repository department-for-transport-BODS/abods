import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of, throwError } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { OnTimeService } from '../on-time.service';
import { TimeOfDayChartComponent } from './time-of-day-chart.component';
import objectContaining = jasmine.objectContaining;
import {
  onTimeInputParams,
  onTimeInputParamsAlt,
  onTimeInputParamsAltTs,
  onTimeInputParamsTimingPointFalse,
  onTimeInputParamsTimingPointTrue,
} from '../on-time.test-constants';

describe('TimeOfDayChartComponent', () => {
  let spectator: Spectator<TimeOfDayChartComponent>;
  let component: TimeOfDayChartComponent;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: TimeOfDayChartComponent,
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

    const spy = spyOn(service, 'fetchOnTimePunctualityTimeOfDayData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));
  });

  it('should re-request data if nocCode changes', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimePunctualityTimeOfDayData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));

    spy.calls.reset();

    component.params = onTimeInputParamsAlt;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParamsAlt));
  });

  it('should re-request data if dates change', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimePunctualityTimeOfDayData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));

    spy.calls.reset();

    component.params = onTimeInputParamsAltTs;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParamsAltTs));
  });

  it('should re-request data if timing points filter changes', () => {
    component.params = onTimeInputParamsTimingPointFalse;

    const spy = spyOn(service, 'fetchOnTimePunctualityTimeOfDayData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParamsTimingPointFalse));

    spy.calls.reset();

    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParamsTimingPointTrue));
  });

  it('should recover from an error condition when filters change', () => {
    const spy = spyOn(service, 'fetchOnTimePunctualityTimeOfDayData').and.returnValues(throwError('bad'), of([]));

    component.params = onTimeInputParamsTimingPointFalse;

    spectator.detectChanges();

    // Force a reload
    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
