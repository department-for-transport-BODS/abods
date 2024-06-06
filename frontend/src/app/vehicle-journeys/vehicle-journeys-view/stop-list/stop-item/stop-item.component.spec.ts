import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateTime } from 'luxon';
import { LuxonModule } from 'luxon-angular';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { SharedModule } from '../../../../shared/shared.module';
import { OnTimePerformanceEnum } from '../../on-time-performance.enum';
import { VehiclePingStop } from '../../vehicle-ping-stop.model';

import { StopItemComponent } from './stop-item.component';

const scheduled = DateTime.fromISO('2022-08-18T11:20:00.000+01:00', { zone: 'utc' });
const actual = DateTime.fromISO('2022-08-18T11:22:00.000+01:00', { zone: 'utc' });

export const mockVehicleStopPingFactory = (): VehiclePingStop => {
  const stop = new VehiclePingStop();
  stop.id = 'ST01';
  stop.stopName = 'Stop 1';
  stop.isTimingPoint = false;
  stop.onTimePerformance = OnTimePerformanceEnum.OnTime;
  stop.ts = actual;
  stop.actualDeparture = stop.ts;
  stop.scheduledDeparture = scheduled;
  return stop;
};

describe('StopItemComponent', () => {
  let component: StopItemComponent;
  let fixture: ComponentFixture<StopItemComponent>;
  let debugEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopItemComponent],
      imports: [SharedModule, HttpClientTestingModule, NgxTippyModule, LuxonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show stop icon if stop', () => {
    component.stop = mockVehicleStopPingFactory();
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.stop-list-item__icon'));

    expect(debugEl.attributes['ng-reflect-src']).toContain('assets/icons/stop.svg');
  });

  it('should show timing point icon if timing point', () => {
    const stop = mockVehicleStopPingFactory();
    stop.isTimingPoint = true;
    component.stop = stop;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.stop-list-item__icon'));

    expect(debugEl.attributes['ng-reflect-src']).toContain('assets/icons/timing.svg');
  });

  it('should show stop name', () => {
    const stop = mockVehicleStopPingFactory();
    component.stop = stop;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.stop-list-item__name'));

    expect(debugEl.nativeElement.innerHTML).toContain('Stop 1');
  });

  it('should show scheduled time', () => {
    const stop = mockVehicleStopPingFactory();
    component.stop = stop;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.stop-list-item__scheduled'));

    expect(debugEl.nativeElement.innerHTML).toContain(scheduled.toFormat('hh:mm'));
  });

  it('should show actual time', () => {
    const stop = mockVehicleStopPingFactory();
    component.stop = stop;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.stop-list-item__actual'));

    expect(debugEl.nativeElement.innerHTML).toContain(actual.toFormat('hh:mm'));
  });
});
