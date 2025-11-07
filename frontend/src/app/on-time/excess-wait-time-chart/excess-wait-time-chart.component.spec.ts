import { DateAxis } from "@amcharts/amcharts4/charts";
import { List } from "@amcharts/amcharts4/core";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime } from "luxon";
import { of } from "rxjs";
import { SharedModule } from "../../shared/shared.module";
import { HeadwayService } from "../headway.service";
import { ExcessWaitTimeChartComponent } from "./excess-wait-time-chart.component";

describe("ExcessWaitTimeChartComponent", () => {
  let spectator: Spectator<ExcessWaitTimeChartComponent>;
  let headwayService: HeadwayService;

  const createComponent = createComponentFactory({
    component: ExcessWaitTimeChartComponent,
    imports: [SharedModule, ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();

    headwayService = spectator.inject(HeadwayService);
  });

  it("should create", async () => {
    await expect(spectator.component).toBeTruthy();
  });

  it("should set min and max dates", async () => {
    spyOn(headwayService, "fetchTimeSeries").and.returnValue(of([]));
    spectator.component.params = {
      fromTimestamp: "2022-02-21",
      toTimestamp: "2022-03-21",
      filters: { nocCodes: ["SCEM"], lineIds: ["LI12345"] },
    };
    spectator.detectChanges();

    const [xAxis] = spectator.component.chart.xAxes as List<DateAxis>;

    await expect(xAxis.min).toEqual(DateTime.fromISO("2022-02-21").toMillis());
    await expect(xAxis.max).toEqual(DateTime.fromISO("2022-03-20").toMillis()); // Minus one day
  });
});
