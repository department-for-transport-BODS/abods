import { CommonModule } from "@angular/common";
import { provideHttpClient } from "@angular/common/http";
import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LuxonModule } from "luxon-angular";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { Direction, Stop } from "../../../../generated/graphql";
import { SharedModule } from "../../../shared/shared.module";
import { StopItemComponent } from "./stop-item/stop-item.component";
import { StopListComponent } from "./stop-list.component";

function mockVehicleStopPingFactory(): Stop {
  return {
    stopId: 1,
    stopName: "Stop 1",
    isTimingPoint: false,
    otp: null,
    scheduledDepartureUtc: "2022-08-18T11:20:00.000+01:00",
    actualDepartureUtc: null,
    estimatedDepartureUtc: null,
    setDown: false,
    incompleteReason: 0,
    latitude: 0,
    longitude: 0,
    stopIndex: 0,
    directionRef: Direction.Inbound,
  };
}

describe("StopListComponent", () => {
  let component: StopListComponent;
  let fixture: ComponentFixture<StopListComponent>;
  let debugEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopListComponent, StopItemComponent],
      imports: [CommonModule, SharedModule, NgxTippyModule, LuxonModule],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it('should show "No stops available" if view is null', async () => {
    component.view = null;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    await expect(debugEl).toBeTruthy();
    await expect(debugEl.nativeElement.innerHTML).toContain(
      "No stops available",
    );
  });

  it('should show "No stops available" if view.stops is an empty array', async () => {
    component.view = { stops: [], avls: [] };
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    await expect(debugEl).toBeTruthy();
    await expect(debugEl.nativeElement.innerHTML).toContain(
      "No stops available",
    );
  });

  it('should not show "No stops available" if view.stops contains stops', async () => {
    component.view = {
      stops: [
        mockVehicleStopPingFactory(),
        mockVehicleStopPingFactory(),
        mockVehicleStopPingFactory(),
      ],
      avls: [],
    };
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    await expect(debugEl).toBeFalsy();
  });
});
