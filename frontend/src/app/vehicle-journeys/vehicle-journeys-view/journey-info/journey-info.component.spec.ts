import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateTime } from 'luxon';
import { LuxonModule } from 'luxon-angular';
import { VehicleJourneyInfo } from '../vehicle-journey-view.model';

import { JourneyInfoComponent } from './journey-info.component';

describe('JourneyInfoComponent', () => {
  let component: JourneyInfoComponent;
  let fixture: ComponentFixture<JourneyInfoComponent>;
  let debugEl: DebugElement;

  const startTime = DateTime.fromISO('2022-08-18T11:22:00.000+01:00', { zone: 'utc' });
  const mockInfo = <VehicleJourneyInfo>{
    operatorInfo: {
      operatorId: '1',
      operatorName: 'Operator 1',
      nocCode: 'NO1',
    },
    serviceInfo: {
      serviceId: '5',
      serviceName: 'Bristol to Bath',
      serviceNumber: '5',
    },
    startTime: startTime,
    vehicleId: 'ABC-123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JourneyInfoComponent],
      imports: [LuxonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JourneyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('journeyInfo', () => {
    beforeEach(() => {
      component.journeyInfo = mockInfo;
      component.loading = false;
      fixture.detectChanges();
      debugEl = fixture.debugElement.query(By.css('.journey-info'));
    });

    it('should show operator name and noc', () => {
      expect(debugEl.nativeElement.innerHTML).toContain('Operator 1 (NO1)');
    });

    it('should show service pattern name', () => {
      expect(debugEl.nativeElement.innerHTML).toContain('Bristol to Bath');
    });

    it('should date and time', () => {
      expect(debugEl.nativeElement.innerHTML).toContain(startTime.toFormat('dd MMM yyyy, hh:mm'));
    });

    it('should vehicle ID', () => {
      expect(debugEl.nativeElement.innerHTML).toContain('ABC-123');
    });
  });
});
