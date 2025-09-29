import { TestBed } from "@angular/core/testing";
import { AgGridModule } from "ag-grid-angular";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { DateTime } from "luxon";
import { EventStatsDocument } from "../../generated/graphql";
import { FeedMonitoringService } from "./feed-monitoring.service";

fdescribe("FeedMonitoringService", () => {
  let service: FeedMonitoringService;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule, AgGridModule],
    });
    service = TestBed.inject(FeedMonitoringService);
    controller = TestBed.inject(ApolloTestingController);
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  it("should send dates in UTC", async () => {
    service
      .fetchAlertStats(
        "OP01",
        DateTime.fromISO("2021-05-05T14:30:00.000+01:00"),
      )
      .subscribe((stats) => {
        void expect(stats).not.toBeNull();
      });

    const op = controller.expectOne(EventStatsDocument);

    await expect(op.operation.variables.operatorId).toEqual("OP01");
    await expect(op.operation.variables.start).toEqual(
      DateTime.local(2021, 2, 4).toUTC().toISO(),
    );
    await expect(op.operation.variables.end).toEqual(
      DateTime.local(2021, 5, 5).toUTC().toISO(),
    );

    op.flush({
      data: {
        eventStats: [{}],
      },
    });

    controller.verify();
  });
});
