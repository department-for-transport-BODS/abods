import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { cloneDeep } from "lodash-es";
import { DateTime } from "luxon";
import { of, throwError } from "rxjs";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";
import { OnTimeService } from "../on-time.service";
import {
  onTimeInputParams,
  onTimeInputParamsAlt,
  onTimeInputParamsTimingPointFalse,
  onTimeInputParamsTimingPointTrue,
} from "../on-time.test-constants";
import { StackedHistogramChartComponent } from "../stacked-histogram-chart/stacked-histogram-chart.component";
import { TimeOfDayChartComponent } from "../time-of-day-chart/time-of-day-chart.component";
import { DayOfWeekChartComponent } from "./day-of-week-chart.component";
import objectContaining = jasmine.objectContaining;

describe("DayOfWeekChartComponent", () => {
  let spectator: Spectator<DayOfWeekChartComponent>;
  let component: DayOfWeekChartComponent;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: DayOfWeekChartComponent,
    declarations: [TimeOfDayChartComponent, StackedHistogramChartComponent],
    imports: [LayoutModule, SharedModule, ApolloTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(OnTimeService);
  });

  it("should create", async () => {
    spectator.detectChanges();

    await expect(spectator.component).toBeTruthy();
  });

  it("should request data", () => {
    component.params = onTimeInputParams;

    const spy = spyOn(
      service,
      "fetchOnTimePunctualityDayOfWeekData",
    ).and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));
  });

  it("should re-request data if nocCode changes", () => {
    component.params = onTimeInputParams;

    const spy = spyOn(
      service,
      "fetchOnTimePunctualityDayOfWeekData",
    ).and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));
    spy.calls.reset();

    component.params = onTimeInputParamsAlt;
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParamsAlt));
  });

  it("should re-request data if dates change", () => {
    component.params = onTimeInputParams;
    const spy = spyOn(
      service,
      "fetchOnTimePunctualityDayOfWeekData",
    ).and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(onTimeInputParams));
    spy.calls.reset();

    const inputParams = cloneDeep(onTimeInputParams);
    inputParams.fromTimestamp = DateTime.fromISO(
      "2021-02-01T00:00:00+00:00",
    ).toISO();
    inputParams.toTimestamp = DateTime.fromISO(
      "2021-02-07T23:59:59.999+00:00",
    ).toISO();

    component.params = inputParams;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(objectContaining(inputParams));
  });

  it("should re-request data if timing points filter changes", () => {
    component.params = onTimeInputParamsTimingPointFalse;

    const spy = spyOn(
      service,
      "fetchOnTimePunctualityDayOfWeekData",
    ).and.returnValue(of());

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      objectContaining(onTimeInputParamsTimingPointFalse),
    );

    spy.calls.reset();

    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      objectContaining(onTimeInputParamsTimingPointTrue),
    );
  });

  it("should recover from an error condition when filters change", async () => {
    const spy = spyOn(
      service,
      "fetchOnTimePunctualityDayOfWeekData",
    ).and.returnValues(throwError("bad"), of([]));

    component.params = onTimeInputParamsTimingPointFalse;

    spectator.detectChanges();

    // Force a reload
    component.params = onTimeInputParamsTimingPointTrue;

    spectator.detectChanges();

    await expect(spy).toHaveBeenCalledTimes(2);
  });
});
