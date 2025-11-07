import {
  byText,
  createRoutingFactory,
  SpectatorRouting,
} from "@ngneat/spectator";
import { DateTime, Settings } from "luxon";
import { SvgIconRegistryService } from "angular-svg-icon";
import { LuxonModule } from "luxon-angular";
import { JourneyNavComponent } from "./journey-nav.component";
import { SharedModule } from "../../../shared/shared.module";
import { LayoutModule } from "../../../layout/layout.module";
import { Location } from "@angular/common";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { fakeAsync, tick } from "@angular/core/testing";

describe("JourneyNavComponent", () => {
  let spectator: SpectatorRouting<JourneyNavComponent>;

  const createComponent = createRoutingFactory({
    component: JourneyNavComponent,
    imports: [SharedModule, LayoutModule, LuxonModule, NgxTippyModule],
    mocks: [SvgIconRegistryService],
    stubsEnabled: false,
    routes: [
      { path: "vehicle-journeys/VJ001", component: JourneyNavComponent },
      { path: "vehicle-journeys/VJ002", component: JourneyNavComponent },
      { path: "vehicle-journeys/VJ003", component: JourneyNavComponent },
    ],
  });

  beforeEach(() => {
    Settings.defaultZone = "utc";
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    spectator.component.journeys = [
      {
        groupId: "VJ001",
        startTime: DateTime.fromISO("2022-08-01T08:45:00.000").toISO(),
        operatorName: "OP01",
        operatorNoc: "OP01",
        serviceName: "SN1",
        serviceNumber: "1",
        isCancelled: false,
      },
      {
        groupId: "VJ002",
        startTime: DateTime.fromISO("2022-08-01T09:15:00.000").toISO(),
        operatorName: "OP01",
        operatorNoc: "OP01",
        serviceName: "SN1",
        serviceNumber: "1",
        isCancelled: false,
      },
      {
        groupId: "VJ003",
        startTime: DateTime.fromISO("2022-08-01T10:05:00.000").toISO(),
        operatorName: "OP01",
        operatorNoc: "OP01",
        serviceName: "SN1",
        serviceNumber: "1",
        isCancelled: false,
      },
    ];
    spectator.component.currentIndex = 1; // Pointing to VJ002
    spectator.detectChanges();
  });

  it("should create", () => {
    expect(spectator.component).toBeTruthy();
  });

  it("should navigate to previous journey", fakeAsync(() => {
    spectator.router.initialNavigation();
    tick();
    spectator.click(byText("09:45"));
    tick();

    expect(spectator.inject(Location).path()).toEqual(
      "/vehicle-journeys/VJ001?startTime=2022-08-01T08:45:00.000Z",
    );
  }));

  it("should navigate to next journey", fakeAsync(() => {
    spectator.router.initialNavigation();
    tick();
    spectator.click(byText("11:05"));
    tick();

    expect(spectator.inject(Location).path()).toEqual(
      "/vehicle-journeys/VJ003?startTime=2022-08-01T10:05:00.000Z",
    );
  }));

  it("should show a disabled link when no next journey is available", () => {
    spectator.component.journeys = [];
    spectator.detectChanges();

    expect(".journey-nav__link--disabled").toBeVisible();
  });
});
