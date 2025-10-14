import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApolloTestingModule } from "apollo-angular/testing";

import { provideHttpClient } from "@angular/common/http";
import { mockProvider } from "@ngneat/spectator";
import { polygon } from "@turf/helpers";
import { of } from "rxjs";
import { ChipComponent } from "../../shared/components/chip/chip.component";
import { SharedModule } from "../../shared/shared.module";
import { AdminAreaService } from "../admin-area/admin-area.service";
import { FilterChipsComponent } from "./filter-chips.component";

fdescribe("FilterChipsComponent", () => {
  let component: FilterChipsComponent;
  let fixture: ComponentFixture<FilterChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApolloTestingModule, SharedModule],
      declarations: [FilterChipsComponent, ChipComponent],
      providers: [
        provideHttpClient(),
        mockProvider(AdminAreaService, {
          fetchAdminAreas: () =>
            of([
              {
                id: "AA100",
                name: "Derbyshire",
                shape: JSON.stringify(polygon([])),
              },
              {
                id: "AA370",
                name: "South Yorkshire",
                shape: JSON.stringify(polygon([])),
              },
            ]),
          fetchAdminAreasForOperator: () =>
            of([
              {
                id: "AA370",
                name: "South Yorkshire",
                shape: JSON.stringify(polygon([])),
              },
            ]),
        }),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  describe("dayOfWeekValues", () => {
    it('should return "Mon, Tue, Wed"', async () => {
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

      await expect(component.dayOfWeekValues).toBe("Mon, Tue, Wed");
      expect(component.isDayOfWeek).toBeTrue();
    });

    it("should return empty string if no flags", async () => {
      component.filters = {};
      fixture.detectChanges();

      await expect(component.dayOfWeekValues).toBe("");
      expect(component.isDayOfWeek).toBeFalse();
    });
  });

  describe("timeRange", () => {
    it("should return start and end time", async () => {
      component.filters = {
        startTime: "09:00",
        endTime: "16:59",
      };
      fixture.detectChanges();

      await expect(component.timeRange).toBe("09:00 - 16:59");
      expect(component.isTimeRange).toBeTrue();
    });
  });

  describe("minDelay", () => {
    it("should return min delay as positive int", async () => {
      component.filters = {
        minDelay: -10,
      };
      fixture.detectChanges();

      await expect(component.minDelay).toBe("10 minutes");
      expect(component.isMinDelay).toBeTrue();
    });

    it("should return empty string if undefined", async () => {
      component.filters = {
        minDelay: undefined,
      };
      fixture.detectChanges();

      await expect(component.minDelay).toBe("");
      expect(component.isMinDelay).toBeFalse();
    });
  });

  describe("maxDelay", () => {
    it("should return max delay", async () => {
      component.filters = {
        maxDelay: 10,
      };
      fixture.detectChanges();

      await expect(component.maxDelay).toBe("10 minutes");
      expect(component.isMaxDelay).toBeTrue();
    });
  });

  describe("onClearDayOfWeekFilter", () => {
    it("should delete dayOfWeekFlags property", async () => {
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

      await expect(component.filters.dayOfWeekFlags).toBeUndefined();
      expect(component.isDayOfWeek).toBeFalse();
    });
  });

  describe("onClearTimeRangeFilter", () => {
    it("should delete startTime and endTime properties", async () => {
      component.filters = {
        startTime: "09:00",
        endTime: "16:59",
      };
      fixture.detectChanges();
      component.onClearTimeRangeFilter();

      await expect(component.filters.startTime).toBeUndefined();
      await expect(component.filters.endTime).toBeUndefined();
      expect(component.isTimeRange).toBeFalse();
    });
  });

  describe("onClearMinDelayFilter", () => {
    it("should delete minDelay property", async () => {
      component.filters = {
        minDelay: -10,
      };
      fixture.detectChanges();
      component.onClearMinDelayFilter();

      await expect(component.filters.minDelay).toBeUndefined();
      expect(component.isMinDelay).toBeFalse();
    });
  });

  describe("onClearMaxDelayFilter", () => {
    it("should delete maxDelay property", async () => {
      component.filters = {
        maxDelay: 10,
      };
      fixture.detectChanges();
      component.onClearMaxDelayFilter();

      await expect(component.filters.maxDelay).toBeUndefined();
      expect(component.isMaxDelay).toBeFalse();
    });
  });

  describe("adminAreas", () => {
    it("should show admin area names", async () => {
      component.filters = {
        adminAreaIds: ["AA100"],
      };
      // TODO why doesn't the TestBed call this by itself?
      component.ngOnChanges();
      fixture.detectChanges();

      await expect(component.adminAreas.length).toEqual(1);
      await expect(component.adminAreas[0].id).toEqual("AA100");
      await expect(component.adminAreas[0].name).toEqual("Derbyshire");
    });

    it("should hide admin areas that are unavailable to the current operator", async () => {
      component.filters = {
        nocCodes: ["OP152"],
        adminAreaIds: ["AA100", "AA370"],
      };
      component.ngOnChanges();
      fixture.detectChanges();

      await expect(component.adminAreas.length).toEqual(1);
      await expect(component.adminAreas[0].id).toEqual("AA370");
      await expect(component.adminAreas[0].name).toEqual("South Yorkshire");
    });

    it("should clear admin areas", async () => {
      component.filters = {
        adminAreaIds: ["AA100", "AA370"],
      };
      component.ngOnChanges();
      fixture.detectChanges();

      await expect(component.adminAreas.length).toEqual(2);

      component.clearAdminAreaFilter("AA100");
      component.ngOnChanges();
      fixture.detectChanges();

      await expect(component.adminAreas.length).toEqual(1);
      await expect(component.adminAreas[0].id).toEqual("AA370");
      await expect(component.adminAreas[0].name).toEqual("South Yorkshire");
    });
  });
});
