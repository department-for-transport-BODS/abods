import { DateTime, Settings } from "luxon";
import { VehicleJourneysGridComponent } from "./vehicle-journeys-grid.component";
import { Spectator, byText, createComponentFactory } from "@ngneat/spectator";
import { SharedModule } from "../../../shared/shared.module";
import { Journey } from "../../../../generated/graphql";
import { RouterModule } from "@angular/router";

describe("VehicleJourneysGridComponent", () => {
  let spectator: Spectator<VehicleJourneysGridComponent>;
  let component: VehicleJourneysGridComponent;

  const t1 = DateTime.fromISO("2022-08-01T06:45:00+01:00");
  const t2 = DateTime.fromISO("2022-08-01T06:55:00+01:00");
  const t3 = DateTime.fromISO("2022-08-01T07:28:00+01:00");
  const t4 = DateTime.fromISO("2022-08-01T15:38:00+01:00");
  const t5 = DateTime.fromISO("2022-08-01T15:55:00+01:00");
  const journeys: Journey[] = [
    {
      groupId: "VJefdb0f42",
      startTime: t1.toISO(),
      operatorName: "OP01",
      operatorNoc: "OP01",
      serviceName: "OP1",
      serviceNumber: "1",
      isCancelled: false,
    },
    {
      groupId: "VJf3c22dad",
      startTime: t2.toISO(),
      operatorName: "OP02",
      operatorNoc: "OP02",
      serviceName: "OP2",
      serviceNumber: "2",
      isCancelled: false,
    },
    {
      groupId: "VJa3968321",
      startTime: t3.toISO(),
      operatorName: "OP03",
      operatorNoc: "OP03",
      serviceName: "OP3",
      serviceNumber: "3",
      isCancelled: false,
    },
    {
      groupId: "VJ4aa8804d",
      startTime: t4.toISO(),
      operatorName: "OP03",
      operatorNoc: "OP03",
      serviceName: "OP3",
      serviceNumber: "3",
      isCancelled: false,
    },
    {
      groupId: "VJa921fcb5",
      startTime: t5.toISO(),
      operatorName: "OP01",
      operatorNoc: "OP01",
      serviceName: "OP1",
      serviceNumber: "1",
      isCancelled: false,
    },
  ];

  const createComponent = createComponentFactory({
    component: VehicleJourneysGridComponent,
    imports: [SharedModule, RouterModule.forRoot([])],
  });

  beforeEach(() => {
    Settings.defaultZone = "utc";
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    component = spectator.component;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should group start times by service patterns", async () => {
    component.data = journeys;

    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    const gridEls = spectator.queryAll(".journey-search-grid");

    expect(spectator.query(byText("1: OP1"))).toBeVisible();
    expect(gridEls[0].textContent).toContain("06:45");
    expect(gridEls[0].textContent).toContain("15:55");
    expect(spectator.query(byText("2: OP2"))).toBeVisible();
    expect(gridEls[1].textContent).toContain("06:55");
    expect(spectator.query(byText("3: OP3"))).toBeVisible();
    expect(gridEls[2].textContent).toContain("07:28");
    expect(gridEls[2].textContent).toContain("15:38");
  });

  it("should add routerLink to start times with groupId and query params", async () => {
    component.operatorId = "OP3";
    component.serviceId = "LI4728";
    component.data = journeys;

    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    const linksEls = spectator.queryAll(".journey-search-grid__time");
    const link1 = `/vehicle-journeys/VJefdb0f42?operator=OP3&service=LI4728`;
    const link2 = `/vehicle-journeys/VJa921fcb5?operator=OP3&service=LI4728`;
    const link3 = `/vehicle-journeys/VJf3c22dad?operator=OP3&service=LI4728`;
    const link4 = `/vehicle-journeys/VJa3968321?operator=OP3&service=LI4728`;
    const link5 = `/vehicle-journeys/VJ4aa8804d?operator=OP3&service=LI4728`;

    expect(linksEls.length).toEqual(5);
    expect(linksEls[0].getAttribute("href")).toEqual(link1);
    expect(linksEls[1].getAttribute("href")).toEqual(link2);
    expect(linksEls[2].getAttribute("href")).toEqual(link3);
    expect(linksEls[3].getAttribute("href")).toEqual(link4);
    expect(linksEls[4].getAttribute("href")).toEqual(link5);
  });
});
