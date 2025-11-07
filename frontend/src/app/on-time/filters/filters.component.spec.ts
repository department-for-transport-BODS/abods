import { FormsModule } from "@angular/forms";
import {
  byLabel,
  byText,
  createComponentFactory,
  Spectator,
} from "@ngneat/spectator";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";

import { ApolloTestingModule } from "apollo-angular/testing";
import { of } from "rxjs";
import { getDefaultDayOfWeekFlags } from "../../shared/components/day-of-week-select/day-of-week-utils";
import { AdminAreaService } from "../admin-area/admin-area.service";
import { FiltersComponent } from "./filters.component";

describe("FiltersComponent", () => {
  let spectator: Spectator<FiltersComponent>;
  let component: FiltersComponent;

  const createComponent = createComponentFactory({
    component: FiltersComponent,
    imports: [LayoutModule, SharedModule, FormsModule, ApolloTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: AdminAreaService,
          useValue: {
            fetchAdminAreas: () =>
              of([
                {
                  id: "1",
                  name: "Test 1",
                  shape: "",
                },
              ]),
          },
        },
      ],
    });
    component = spectator.component;

    component.filters = {};
    spectator.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should load with defaults", async () => {
    await expect(component.startTime).toEqual("00:00");
  });

  it("it should reset to default filters", () => {
    const spy = spyOn(component.filtersChange, "emit");

    component.filters = {
      dayOfWeekFlags: {
        monday: false,
        tuesday: true,
        wednesday: false,
        thursday: true,
        friday: false,
        sunday: true,
        saturday: false,
      },
      startTime: "11:00",
      endTime: "12:59",
      minDelay: -30,
      maxDelay: 60,
      excludeItoLineId: "ABC",
      adminAreaIds: ["AA110"],
    };

    spectator.click(byText("Reset to defaults"));
    spectator.click(byText("Apply"));

    expect(spy).toHaveBeenCalledWith({});
  });

  it("it should not emit new filters if close clicked", async () => {
    const spy = spyOn(component.filtersChange, "emit");
    const closeSpy = spyOn(component.closeFilters, "emit");
    spectator.click(byText("Close"));

    await expect(spy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledWith();
  });

  it("it should emit new filters once apply has been clicked", async () => {
    const spy = spyOn(component.filtersChange, "emit");
    const closeSpy = spyOn(component.closeFilters, "emit");

    spectator.click(byLabel("Sat"));
    spectator.click(byLabel("Sun"));

    component.startTime = "07:00";
    component.endTime = "20:59";
    component.minDelayStr = "-20";
    component.maxDelayStr = "30";

    spectator.detectChanges();

    await expect(spy).not.toHaveBeenCalled();

    spectator.click(byText("Apply"));

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        dayOfWeekFlags: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          sunday: false,
          saturday: false,
        },
        startTime: "07:00",
        endTime: "20:59",
        minDelay: -20,
        maxDelay: 30,
      }),
    );

    await expect(closeSpy).not.toHaveBeenCalled();
  });

  it('it should allow the delay filters to be set back to "no delay"', async () => {
    const spy = spyOn(component.filtersChange, "emit");

    component.minDelayStr = "-20";
    component.maxDelayStr = "30";
    spectator.detectChanges();

    spectator.click(byText("Apply"));

    component.minDelayStr = "none";
    component.maxDelayStr = "none";
    spectator.detectChanges();

    spy.calls.reset();

    spectator.click(byText("Apply"));

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({}));

    // Want to be able to say was called with an object the didn't contain - this is the best I came up with,
    await expect(spy.calls.mostRecent().args[0]?.minDelay).toBeUndefined();
    await expect(spy.calls.mostRecent().args[0]?.maxDelay).toBeUndefined();
  });

  describe("setSelectedAdminAreaIds", () => {
    it("should set adminAreaIds to only those present in adminAreas$", (done: DoneFn) => {
      const mockAreas = [
        { label: "Area 1", value: "AA110" },
        { label: "Area 2", value: "AA120" },
      ];
      component.adminAreas$ = of(mockAreas);

      // eslint-disable-next-line @typescript-eslint/dot-notation
      component["setSelectedAdminAreaIds"](["AA110", "ZZ999"]);
      setTimeout(() => {
        void expect(component.adminAreaIds).toEqual(["AA110"]);
        done();
      });
    });

    it("should set adminAreaIds to empty if none match adminAreas$", (done: DoneFn) => {
      component.adminAreas$ = of([{ label: "Area 1", value: "AA110" }]);
      // eslint-disable-next-line @typescript-eslint/dot-notation
      component["setSelectedAdminAreaIds"](["ZZ999"]);
      setTimeout(() => {
        void expect(component.adminAreaIds).toEqual([]);
        done();
      });
    });
  });

  describe("apply", () => {
    it("should emit filtersChange with correct filters when valid", () => {
      const spy = spyOn(component.filtersChange, "emit");
      component.dayOfWeekFlags = {
        ...getDefaultDayOfWeekFlags(),
        monday: false,
      };
      component.startTime = "07:00";
      component.endTime = "20:59";
      component.minDelay = -10;
      component.maxDelay = 30;
      component.excludeItoLineId = "ABC";
      component.adminAreaIds = ["AA110"];
      component.showAdminAreas = true;

      component.apply();

      expect(spy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          dayOfWeekFlags: jasmine.any(Object),
          startTime: "07:00",
          endTime: "20:59",
          minDelay: -10,
          maxDelay: 30,
          excludeItoLineId: "ABC",
          adminAreaIds: ["AA110"],
        }),
      );
    });

    it("should not emit filtersChange if validation fails", async () => {
      const spy = spyOn(component.filtersChange, "emit");
      component.startTime = "25:00"; // Invalid time
      component.endTime = "20:00";
      component.apply();
      await expect(spy).not.toHaveBeenCalled();
    });

    it("should emit filtersChange with adminAreaIds from oldFilters if showAdminAreas is false", () => {
      const spy = spyOn(component.filtersChange, "emit");
      component.showAdminAreas = false;
      component.oldFilters = { adminAreaIds: ["AA110"] };
      component.apply();
      expect(spy).toHaveBeenCalledWith(
        jasmine.objectContaining({ adminAreaIds: ["AA110"] }),
      );
    });
  });

  describe("resetToDefault", () => {
    it("should reset filters to default values", async () => {
      component.dayOfWeekFlags = {
        ...getDefaultDayOfWeekFlags(),
        monday: false,
      };
      component.startTime = "07:00";
      component.endTime = "20:59";
      component.minDelay = -10;
      component.maxDelay = 30;
      component.excludeItoLineId = "ABC";
      component.adminAreaIds = ["AA110"];

      component.resetToDefault();

      await expect(component.dayOfWeekFlags).toEqual(
        getDefaultDayOfWeekFlags(),
      );
      await expect(component.startTime).toBe("00:00");
      await expect(component.endTime).toBe("23:59");
      await expect(component.minDelay).toBeNull();
      await expect(component.maxDelay).toBeNull();
      await expect(component.excludeItoLineId).toBe("");
      await expect(component.adminAreaIds).toEqual([]);
    });
  });

  describe("cancel", () => {
    it("should emit closeFilters", () => {
      const spy = spyOn(component.closeFilters, "emit");
      component.cancel();
      expect(spy).toHaveBeenCalledWith();
    });
  });

  describe("validate", () => {
    it("should return error if no dayOfWeekFlags are selected", async () => {
      component.dayOfWeekFlags = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      };
      const errors = component.validate();
      await expect(errors.dayOfWeekFlags).toBe(
        "Please select at least one day.",
      );
    });

    it("should return error if startTime is invalid", async () => {
      component.startTime = "25:00";
      const errors = component.validate();
      await expect(errors.startTime).toContain("Start time must be between");
    });

    it("should return error if endTime is invalid", async () => {
      component.endTime = "99:99";
      const errors = component.validate();
      await expect(errors.endTime).toContain("End time must be between");
    });

    it("should return error if startTime is after endTime", async () => {
      component.startTime = "20:00";
      component.endTime = "10:00";
      const errors = component.validate();
      await expect(errors.startEndTime).toBe(
        "Start time must be before end time.",
      );
    });
  });
});
