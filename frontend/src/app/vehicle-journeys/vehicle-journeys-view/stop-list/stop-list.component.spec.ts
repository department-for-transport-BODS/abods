import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { mockVehicleStopPingFactory } from './stop-item/stop-item.component.spec';

import { StopListComponent } from './stop-list.component';

describe('StopListComponent', () => {
  let component: StopListComponent;
  let fixture: ComponentFixture<StopListComponent>;
  let debugEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "No stops available" if stop list is undefined', () => {
    component.stopList = undefined;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.no-stops'));

    expect(debugEl).toBeTruthy();
    expect(debugEl.nativeElement.innerHTML).toContain('No stops available');
  });

  it('should show "No stops available" if stop list is empty array', () => {
    component.stopList = [];
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.no-stops'));

    expect(debugEl).toBeTruthy();
    expect(debugEl.nativeElement.innerHTML).toContain('No stops available');
  });

  it('should not show "No stops available" if stop list contains stops', () => {
    component.stopList = [mockVehicleStopPingFactory(), mockVehicleStopPingFactory(), mockVehicleStopPingFactory()];
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css('.no-stops'));

    expect(debugEl).toBeFalsy();
  });
});
