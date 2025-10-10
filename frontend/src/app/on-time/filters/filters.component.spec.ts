import { FormsModule } from "@angular/forms";
import {
  byLabel,
  byText,
  createComponentFactory,
  Spectator,
} from "@ngneat/spectator";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";

import { FiltersComponent } from "./filters.component";
import { AdminAreaService } from "../admin-area/admin-area.service";
import { of } from "rxjs";
import { getDefaultDayOfWeekFlags } from "../../shared/components/day-of-week-select/day-of-week-utils";

describe("FiltersComponent", () => {
  let spectator: Spectator<FiltersComponent>;
  let component: FiltersComponent;

  const createComponent = createComponentFactory({
    component: FiltersComponent,
    imports: [LayoutModule, SharedModule, FormsModule],
    mocks: [AdminAreaService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;

    component.filters = {};
    spectator.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load with defaults", () => {
    expect(component.startTime).toEqual("00:00");
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

  it("it should not emit new filters if close clicked", () => {
    const spy = spyOn(component.filtersChange, "emit");
    const closeSpy = spyOn(component.closeFilters, "emit");
    spectator.click(byText("Close"));

    expect(spy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledWith();
  });

  it("it should emit new filters once apply has been clicked", () => {
    const spy = spyOn(component.filtersChange, "emit");
    const closeSpy = spyOn(component.closeFilters, "emit");

    spectator.click(byLabel("Sat"));
    spectator.click(byLabel("Sun"));

    spectator.typeInElement("07", spectator.query(byLabel("Start time"))!);
    spectator.typeInElement("20", spectator.query(byLabel("End time"))!);

    component.minDelayStr = "-20";
    component.maxDelayStr = "30";

    spectator.detectChanges();

    expect(spy).not.toHaveBeenCalled();

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

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('it should allow the delay filters to be set back to "no delay"', () => {
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
    expect(spy.calls.mostRecent().args[0]?.minDelay).toBeUndefined();
    expect(spy.calls.mostRecent().args[0]?.maxDelay).toBeUndefined();
  });

  describe("setSelectedAdminAreaIds", () => {
    it("should set adminAreaIds to only those present in adminAreas$", (done) => {
      const mockAreas = [
        { label: "Area 1", value: "AA110" },
        { label: "Area 2", value: "AA120" },
      ];
      component.adminAreas$ = of(mockAreas);

      // eslint-disable-next-line @typescript-eslint/dot-notation
      component["setSelectedAdminAreaIds"](["AA110", "ZZ999"]);
      setTimeout(() => {
        expect(component.adminAreaIds).toEqual(["AA110"]);
        done();
      });
    });

    it("should set adminAreaIds to empty if none match adminAreas$", (done) => {
      component.adminAreas$ = of([{ label: "Area 1", value: "AA110" }]);
      // eslint-disable-next-line @typescript-eslint/dot-notation
      component["setSelectedAdminAreaIds"](["ZZ999"]);
      setTimeout(() => {
        expect(component.adminAreaIds).toEqual([]);
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

    it("should not emit filtersChange if validation fails", () => {
      const spy = spyOn(component.filtersChange, "emit");
      component.startTime = "25:00"; // Invalid time
      component.endTime = "20:00";
      component.apply();
      expect(spy).not.toHaveBeenCalled();
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
    it("should reset filters to default values", () => {
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

      expect(component.dayOfWeekFlags).toEqual(getDefaultDayOfWeekFlags());
      expect(component.startTime).toBe("00:00");
      expect(component.endTime).toBe("23:59");
      expect(component.minDelay).toBeNull();
      expect(component.maxDelay).toBeNull();
      expect(component.excludeItoLineId).toBe("");
      expect(component.adminAreaIds).toEqual([]);
    });
  });

  describe("cancel", () => {
    it("should emit closeFilters", () => {
      const spy = spyOn(component.closeFilters, "emit");
      component.cancel();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("should return error if no dayOfWeekFlags are selected", () => {
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
      expect(errors.dayOfWeekFlags).toBe("Please select at least one day.");
    });

    it("should return error if startTime is invalid", () => {
      component.startTime = "25:00";
      const errors = component.validate();
      expect(errors.startTime).toContain("Start time must be between");
    });

    it("should return error if endTime is invalid", () => {
      component.endTime = "99:99";
      const errors = component.validate();
      expect(errors.endTime).toContain("End time must be between");
    });

    it("should return error if startTime is after endTime", () => {
      component.startTime = "20:00";
      component.endTime = "10:00";
      const errors = component.validate();
      expect(errors.startEndTime).toBe("Start time must be before end time.");
    });
  });
});
