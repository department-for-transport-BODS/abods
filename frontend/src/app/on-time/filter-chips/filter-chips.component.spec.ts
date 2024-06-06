import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { FilterChipsComponent } from './filter-chips.component';
import { mockProvider } from '@ngneat/spectator';
import { AdminAreaService } from '../admin-area/admin-area.service';
import { of } from 'rxjs';
import { polygon } from '@turf/helpers';

describe('FilterChipsComponent', () => {
  let component: FilterChipsComponent;
  let fixture: ComponentFixture<FilterChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      declarations: [FilterChipsComponent],
      providers: [
        mockProvider(AdminAreaService, {
          fetchAdminAreas: () =>
            of([
              { id: 'AA100', name: 'Derbyshire', shape: JSON.stringify(polygon([])) },
              { id: 'AA370', name: 'South Yorkshire', shape: JSON.stringify(polygon([])) },
            ]),
          fetchAdminAreasForOperator: () =>
            of([{ id: 'AA370', name: 'South Yorkshire', shape: JSON.stringify(polygon([])) }]),
        }),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dayOfWeekValues', () => {
    it('should return "Mon, Tue, Wed"', () => {
      component.filters = {
        dayOfWeekFlags: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
      };
      fixture.detectChanges();

      expect(component.dayOfWeekValues).toBe('Mon, Tue, Wed');
      expect(component.isDayOfWeek).toBeTrue();
    });

    it('should return empty string if no flags', () => {
      component.filters = {};
      fixture.detectChanges();

      expect(component.dayOfWeekValues).toBe('');
      expect(component.isDayOfWeek).toBeFalse();
    });
  });

  describe('timeRange', () => {
    it('should return start and end time', () => {
      component.filters = {
        startTime: '09:00',
        endTime: '16:59',
      };
      fixture.detectChanges();

      expect(component.timeRange).toBe('09:00 - 16:59');
      expect(component.isTimeRange).toBeTrue();
    });
  });

  describe('minDelay', () => {
    it('should return min delay as positive int', () => {
      component.filters = {
        minDelay: -10,
      };
      fixture.detectChanges();

      expect(component.minDelay).toBe('10 minutes');
      expect(component.isMinDelay).toBeTrue();
    });

    it('should return empty string if undefined', () => {
      component.filters = {
        minDelay: undefined,
      };
      fixture.detectChanges();

      expect(component.minDelay).toBe('');
      expect(component.isMinDelay).toBeFalse();
    });
  });

  describe('maxDelay', () => {
    it('should return max delay', () => {
      component.filters = {
        maxDelay: 10,
      };
      fixture.detectChanges();

      expect(component.maxDelay).toBe('10 minutes');
      expect(component.isMaxDelay).toBeTrue();
    });
  });

  describe('onClearDayOfWeekFilter', () => {
    it('should delete dayOfWeekFlags property', () => {
      component.filters = {
        dayOfWeekFlags: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
      };
      fixture.detectChanges();
      component.onClearDayOfWeekFilter();

      expect(component.filters.dayOfWeekFlags).toBeUndefined();
      expect(component.isDayOfWeek).toBeFalse();
    });
  });

  describe('onClearTimeRangeFilter', () => {
    it('should delete startTime and endTime properties', () => {
      component.filters = {
        startTime: '09:00',
        endTime: '16:59',
      };
      fixture.detectChanges();
      component.onClearTimeRangeFilter();

      expect(component.filters.startTime).toBeUndefined();
      expect(component.filters.endTime).toBeUndefined();
      expect(component.isTimeRange).toBeFalse();
    });
  });

  describe('onClearMinDelayFilter', () => {
    it('should delete minDelay property', () => {
      component.filters = {
        minDelay: -10,
      };
      fixture.detectChanges();
      component.onClearMinDelayFilter();

      expect(component.filters.minDelay).toBeUndefined();
      expect(component.isMinDelay).toBeFalse();
    });
  });

  describe('onClearMaxDelayFilter', () => {
    it('should delete maxDelay property', () => {
      component.filters = {
        maxDelay: 10,
      };
      fixture.detectChanges();
      component.onClearMaxDelayFilter();

      expect(component.filters.maxDelay).toBeUndefined();
      expect(component.isMaxDelay).toBeFalse();
    });
  });

  describe('adminAreas', () => {
    it('should show admin area names', async () => {
      component.filters = {
        adminAreaIds: ['AA100'],
      };
      // TODO why doesn't the TestBed call this by itself?
      component.ngOnChanges();
      fixture.detectChanges();

      expect(component.adminAreas.length).toEqual(1);
      expect(component.adminAreas[0].id).toEqual('AA100');
      expect(component.adminAreas[0].name).toEqual('Derbyshire');
    });

    it('should hide admin areas that are unavailable to the current operator', () => {
      component.filters = {
        nocCodes: ['OP152'],
        adminAreaIds: ['AA100', 'AA370'],
      };
      component.ngOnChanges();
      fixture.detectChanges();

      expect(component.adminAreas.length).toEqual(1);
      expect(component.adminAreas[0].id).toEqual('AA370');
      expect(component.adminAreas[0].name).toEqual('South Yorkshire');
    });

    it('should clear admin areas', () => {
      component.filters = {
        adminAreaIds: ['AA100', 'AA370'],
      };
      component.ngOnChanges();
      fixture.detectChanges();

      expect(component.adminAreas.length).toEqual(2);

      component.clearAdminAreaFilter('AA100');
      component.ngOnChanges();
      fixture.detectChanges();

      expect(component.adminAreas.length).toEqual(1);
      expect(component.adminAreas[0].id).toEqual('AA370');
      expect(component.adminAreas[0].name).toEqual('South Yorkshire');
    });
  });
});
