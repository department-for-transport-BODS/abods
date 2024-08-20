import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { OnTimeService } from '../on-time.service';
import { DelayFrequencyChartComponent } from './delay-frequency-chart.component';
import {
  onTimeInputParams,
  onTimeInputParamsAlt,
  onTimeInputParamsAltTs,
  onTimeInputParamsTimingPointFalse,
  onTimeInputParamsTimingPointTrue,
} from '../on-time.test-constants';
import { PerformanceCategories } from 'src/app/dashboard/dashboard.types';

describe('DelayFrequencyChartComponent', () => {
  let spectator: Spectator<DelayFrequencyChartComponent>;
  let component: DelayFrequencyChartComponent;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: DelayFrequencyChartComponent,
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

    const spy = spyOn(service, 'fetchOnTimeDelayFrequencyData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(onTimeInputParams);
  });

  it('should re-request data if nocCode changes', () => {
    component.params = onTimeInputParams;

    const spy = spyOn(service, 'fetchOnTimeDelayFrequencyData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParams));

    spy.calls.reset();

    component.params = onTimeInputParamsAlt;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParamsAlt));
  });

  it('should re-request data if dates change', () => {
    component.params = onTimeInputParams;
    const spy = spyOn(service, 'fetchOnTimeDelayFrequencyData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParams));

    spy.calls.reset();

    component.params = onTimeInputParamsAltTs;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParamsAltTs));
  });

  it('should re-request data if timing points filter changes', () => {
    component.params = onTimeInputParamsTimingPointFalse;

    const spy = spyOn(service, 'fetchOnTimeDelayFrequencyData').and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParamsTimingPointFalse));

    spy.calls.reset();

    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(onTimeInputParamsTimingPointTrue));
  });

  it('should return correct category based on heuristic function', () => {
    expect(spectator.component.heuristic(-2)).toEqual(PerformanceCategories.Early);
    expect(spectator.component.heuristic(0)).toEqual(PerformanceCategories.OnTime);
    expect(spectator.component.heuristic(6)).toEqual(PerformanceCategories.Late);
  });
});
