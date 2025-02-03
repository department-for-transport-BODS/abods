import { FormsModule } from "@angular/forms";
import {
  byLabel,
  byText,
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";

import { OnTimeFiltersComponent } from "./on-time-filters.component";
import { AdminAreaService } from "../admin-area/admin-area.service";
import { of } from "rxjs";

describe("OnTimeFiltersComponent", () => {
  let spectator: Spectator<OnTimeFiltersComponent>;
  let component: OnTimeFiltersComponent;
  let adminAreaService: SpyObject<AdminAreaService>;
  const mockAdminAreas = [{ id: "AA110", name: "Derbyshire" }];

  const createComponent = createComponentFactory({
    component: OnTimeFiltersComponent,
    imports: [LayoutModule, SharedModule, FormsModule],
    mocks: [AdminAreaService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    adminAreaService = spectator.inject(AdminAreaService);

    component.filters = {};
    spectator.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
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

    spectator.typeInElement(
      "07",
      spectator.query(byLabel("Start time")) as Element,
    );
    spectator.typeInElement(
      "20",
      spectator.query(byLabel("End time")) as Element,
    );

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

    spectator.detectChanges();

    spectator.click(byText("Apply"));

    spectator.detectChanges();

    spy.calls.reset();

    spectator.click(byText("Apply"));

    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({}));

    // Want to be able to say was called with an object the didn't contain - this is the best I came up with,
    expect(spy.calls.mostRecent().args[0]?.minDelay).toBeUndefined();
    expect(spy.calls.mostRecent().args[0]?.maxDelay).toBeUndefined();
  });
});
