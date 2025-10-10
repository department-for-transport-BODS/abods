import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { StopListComponent } from "./stop-list.component";
import { Direction, Stop } from "../../../../generated/graphql";
import { MockComponent } from "ng-mocks";
import { CommonModule } from "@angular/common";

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
      declarations: [MockComponent(StopListComponent)],
      imports: [CommonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it('should show "No stops available" if view is null', () => {
    component.view = null;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    expect(debugEl).toBeTruthy();
    expect(debugEl.nativeElement.innerHTML).toContain("No stops available");
  });

  it('should show "No stops available" if view.stops is undefined', () => {
    component.view = {} as any;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    expect(debugEl).toBeTruthy();
    expect(debugEl.nativeElement.innerHTML).toContain("No stops available");
  });

  it('should show "No stops available" if view.stops is empty array', () => {
    component.view = { stops: [] } as any;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    expect(debugEl).toBeTruthy();
    expect(debugEl.nativeElement.innerHTML).toContain("No stops available");
  });

  it('should not show "No stops available" if view.stops contains stops', () => {
    component.view = {
      stops: [
        mockVehicleStopPingFactory(),
        mockVehicleStopPingFactory(),
        mockVehicleStopPingFactory(),
      ],
    } as any;
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".no-stops"));
    expect(debugEl).toBeFalsy();
  });
});
