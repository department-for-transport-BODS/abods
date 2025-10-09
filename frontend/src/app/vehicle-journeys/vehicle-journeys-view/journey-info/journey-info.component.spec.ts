import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DateTime } from "luxon";
import { LuxonModule } from "luxon-angular";

import { JourneyInfoComponent } from "./journey-info.component";
import { Journey } from "../../../../generated/graphql";

describe("JourneyInfoComponent", () => {
  let component: JourneyInfoComponent;
  let fixture: ComponentFixture<JourneyInfoComponent>;
  let debugEl: DebugElement;

  const startTime = DateTime.fromISO("2022-08-18T11:22:00.000+01:00", {
    zone: "utc",
  });
  const mockInfo: Journey = {
    groupId: "GP1",
    operatorName: "Operator",
    operatorNoc: "OP01",
    serviceName: "SN1",
    serviceNumber: "1",
    startTime: startTime.toISO(),
    isCancelled: false,
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

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("journeyInfo", () => {
    beforeEach(() => {
      component.journey = mockInfo;
      component.vehicleRef = "ABC-123";
      component.loading = false;
      fixture.detectChanges();
      debugEl = fixture.debugElement.query(By.css(".journey-info"));
    });

    it("should show operator name and noc", () => {
      expect(debugEl.nativeElement.innerHTML).toContain("Operator (OP01)");
    });

    it("should show service pattern name", () => {
      expect(debugEl.nativeElement.innerHTML).toContain("SN1");
    });

    it("should date and time", () => {
      const londonTime = startTime.setZone("Europe/London", {
        keepLocalTime: false,
      });
      expect(debugEl.nativeElement.innerHTML).toContain(
        londonTime.toFormat("dd MMM yyyy, hh:mm"),
      );
    });

    it("should vehicle ID", () => {
      expect(debugEl.nativeElement.innerHTML).toContain("ABC-123");
    });
  });
});
