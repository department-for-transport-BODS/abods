import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DateTime } from "luxon";
import { LuxonModule } from "luxon-angular";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { SharedModule } from "../../../../shared/shared.module";
import { StopItemComponent } from "./stop-item.component";
import { Direction, OtpEnum, Stop } from "../../../../../generated/graphql";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

const scheduled = "2022-08-18T11:20:00.000+01:00";
const actual = "2022-08-18T11:22:00.000+01:00";

function mockStop(overrides: Partial<Stop> = {}): Stop {
  return {
    stopId: 1,
    stopName: "Stop 1",
    isTimingPoint: false,
    otp: OtpEnum.OnTime,
    scheduledDepartureUtc: scheduled,
    actualDepartureUtc: actual,
    estimatedDepartureUtc: null,
    setDown: false,
    incompleteReason: 0,
    latitude: 0,
    longitude: 0,
    directionRef: Direction.Inbound,
    stopIndex: 0,
    ...overrides,
  };
}

describe("StopItemComponent", () => {
  let component: StopItemComponent;
  let fixture: ComponentFixture<StopItemComponent>;
  let debugEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopItemComponent],
      imports: [SharedModule, NgxTippyModule, LuxonModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show stop icon if not timing point", () => {
    component.stop = mockStop({ isTimingPoint: false });
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".stop-list-item__icon"));
    expect(debugEl.attributes["ng-reflect-src"]).toContain(
      "assets/icons/stop.svg",
    );
  });

  it("should show timing point icon if timing point", () => {
    component.stop = mockStop({ isTimingPoint: true });
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".stop-list-item__icon"));
    expect(debugEl.attributes["ng-reflect-src"]).toContain(
      "assets/icons/timing.svg",
    );
  });

  it("should show stop name", () => {
    component.stop = mockStop();
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(By.css(".stop-list-item__name"));
    expect(debugEl.nativeElement.textContent).toContain("Stop 1");
  });

  it("should show scheduled time in London time", () => {
    component.stop = mockStop();
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(
      By.css(
        ".stop-list-item__scheduled .stop-list-item__time-container--minutes",
      ),
    );
    expect(debugEl.nativeElement.textContent).toBe(
      DateTime.fromISO(scheduled).setZone("Europe/London").toFormat("HH:mm"),
    );
  });

  it("should show actual time in London time", () => {
    component.stop = mockStop();
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(
      By.css(
        ".stop-list-item__actual .stop-list-item__time-container--minutes",
      ),
    );
    expect(debugEl.nativeElement.textContent).toBe(
      DateTime.fromISO(actual).setZone("Europe/London").toFormat("HH:mm"),
    );
  });

  it("should show incomplete reason if no actual/estimated departure", () => {
    component.stop = mockStop({
      actualDepartureUtc: null,
      estimatedDepartureUtc: null,
      setDown: true,
      incompleteReason: 2,
    });
    fixture.detectChanges();
    debugEl = fixture.debugElement.query(
      By.css(".stop-list-item__actual .stop-list-item__time-container"),
    );
    expect(debugEl.nativeElement.textContent.trim()).toBe("—");
  });

  it("should emit stopSelected on name click", () => {
    component.stop = mockStop();
    spyOn(component.stopSelected, "emit");
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css(".stop-list-item__name"));
    btn.triggerEventHandler("click", null);
    expect(component.stopSelected.emit).toHaveBeenCalledWith(component.stop);
  });

  it("should emit stopHovered on mouseenter and mouseleave", () => {
    component.stop = mockStop();
    spyOn(component.stopHovered, "emit");
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css(".stop-list-item__name"));
    btn.triggerEventHandler("mouseenter", null);
    expect(component.stopHovered.emit).toHaveBeenCalledWith({
      stop: component.stop,
      event: "enter",
    });
    btn.triggerEventHandler("mouseleave", null);
    expect(component.stopHovered.emit).toHaveBeenCalledWith({
      stop: component.stop,
      event: "leave",
    });
  });

  it("should hide seconds if timingPointsOnly is true", () => {
    component.stop = mockStop();
    component.timingPointsOnly = true;
    fixture.detectChanges();
    const seconds = fixture.debugElement.queryAll(
      By.css(".stop-list-item__time-container--seconds"),
    );
    expect(seconds.length).toBe(0);
  });

  it("should show seconds if timingPointsOnly is false", () => {
    component.stop = mockStop();
    component.timingPointsOnly = false;
    fixture.detectChanges();
    const seconds = fixture.debugElement.queryAll(
      By.css(".stop-list-item__time-container--seconds"),
    );
    expect(seconds.length).toBeGreaterThan(0);
  });
});
