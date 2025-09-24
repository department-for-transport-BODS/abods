import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import {
  byTextContent,
  createRoutingFactory,
  SpectatorRouting,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";
import {
  DashboardVehicles,
  OperatorDashboardFragment,
} from "src/generated/graphql";
import { DashboardComponent } from "./dashboard.component";
import { DashboardService } from "./dashboard.service";
import { FeedStatusSingleComponent } from "./feed-status-single/feed-status-single.component";
import { FeedStatusSummaryComponent } from "./feed-status-summary/feed-status-summary.component";
import { MockPerformanceChartComponent } from "./performance/chart/mock-chart.component";
import { PerformanceComponent } from "./performance/performance.component";
import { PerformanceRankingComponent } from "./performance/ranking-table/ranking-table.component";
import { VehiclesStatusComponent } from "./vehicles-status/vehicles-status.component";

// Workaround for fakeAsync() trying to load an SVG image via XHR
@Injectable()
class SkipHttpRequestInterceptor implements HttpInterceptor {
  intercept(
    _req: HttpRequest<unknown>,
    _next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return new Observable<HttpEvent<unknown>>((observer) => {
      observer.next({} as HttpEvent<unknown>);
    });
  }
}

describe("DashboardComponent", () => {
  let spectator: SpectatorRouting<DashboardComponent>;
  let component: DashboardComponent;
  let service: DashboardService;

  const createComponent = createRoutingFactory({
    component: DashboardComponent,
    declarations: [
      FeedStatusSingleComponent,
      FeedStatusSummaryComponent,
      VehiclesStatusComponent,
      PerformanceComponent,
      MockPerformanceChartComponent,
      PerformanceRankingComponent,
    ],
    imports: [
      LayoutModule,
      SharedModule,
      RouterTestingModule,
      ApolloTestingModule,
    ],
    providers: [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: SkipHttpRequestInterceptor,
        multi: true,
      },
    ],
    detectChanges: false,
    stubsEnabled: false,
  });

  const operator2: OperatorDashboardFragment = {
    name: "Operator 2",
    nocCode: "OP02",
    operatorId: "OP02",
    feedMonitoring: {
      feedStatus: true,

      liveStats: { feedAlerts: 1, feedErrors: 0 },
    },
  };

  const operator6: OperatorDashboardFragment = {
    name: "Operator 6",
    nocCode: "OP06",
    operatorId: "OP06",
    feedMonitoring: {
      feedStatus: false,
      liveStats: { feedAlerts: 21, feedErrors: 3 },
    },
  };
  const operator2VehicleCounts: DashboardVehicles = {
    operatorId: "OP02",
    actual: 1,
    expected: 2,
  };
  const operator6VehicleCounts: DashboardVehicles = {
    operatorId: "OP06",
    actual: 0,
    expected: 18,
  };
  const operatorList: OperatorDashboardFragment[] = [
    {
      name: "Operator 1",
      nocCode: "OP01",
      operatorId: "OP01",
      feedMonitoring: {
        feedStatus: true,
        liveStats: { feedAlerts: 2, feedErrors: 0 },
      },
    },
    operator2,
    {
      name: "Operator 3",
      nocCode: "OP03",
      operatorId: "OP03",
      feedMonitoring: {
        feedStatus: true,
        liveStats: { feedAlerts: 1, feedErrors: 1 },
      },
    },
    {
      name: "Operator 4",
      nocCode: "OP04",
      operatorId: "OP04",
      feedMonitoring: {
        feedStatus: false,
        liveStats: { feedAlerts: 1, feedErrors: 1 },
      },
    },
    {
      name: "Operator 5",
      nocCode: "OP05",
      operatorId: "OP05",
      feedMonitoring: {
        feedStatus: false,
        liveStats: { feedAlerts: 21, feedErrors: 1 },
      },
    },
    operator6,
  ];
  const vehicleCounts: DashboardVehicles[] = [
    {
      operatorId: "OP01",
      actual: 44,
      expected: 56,
    },
    operator2VehicleCounts,
    {
      operatorId: "OP03",
      actual: 12,
      expected: 14,
    },
    {
      operatorId: "OP04",
      actual: 0,
      expected: 11,
    },
    {
      operatorId: "OP05",
      actual: 0,
      expected: 23,
    },
    operator6VehicleCounts,
  ];

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(DashboardService);
  });

  it("should create", async () => {
    spectator.detectChanges();

    await expect(component).toBeTruthy();
  });

  it("should fetch the dashboard operator list", () => {
    const operatorListSpy = spyOnProperty(
      service,
      "listOperators",
    ).and.returnValue(of(operatorList));
    const vehicleCountsSpy = spyOnProperty(
      service,
      "listOperatorVehicleCounts",
    ).and.returnValue(of(vehicleCounts));

    spectator.detectChanges();

    expect(operatorListSpy).toHaveBeenCalledWith();
    expect(vehicleCountsSpy).toHaveBeenCalledWith();
  });

  it("should display current vehicle count for all operators", () => {
    const currentCount = 57;
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts),
    );

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Current\\w*${currentCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should display expected vehicle count for all operators", () => {
    const expectedCount = 124;
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts),
    );

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Expected\\w*${expectedCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should display current vehicle count for chosen operator", () => {
    const currentCount = 12;
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts),
    );

    spectator.setRouteQueryParam("nocCode", "OP03");

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Current\\w*${currentCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should display expected vehicle count for chosen operator", () => {
    const expectedCount = 56;
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts),
    );

    spectator.setRouteQueryParam("nocCode", "OP01");

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Expected\\w*${expectedCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should display current vehicle count for single operator", () => {
    const currentCount = 1;
    spyOnProperty(service, "listOperators").and.returnValue(of([operator2]));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of([operator2VehicleCounts]),
    );

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Current\\w*${currentCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should display expected vehicle count for single operator", () => {
    const expectedCount = 2;
    spyOnProperty(service, "listOperators").and.returnValue(of([operator2]));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of([operator2VehicleCounts]),
    );

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Expected\\w*${expectedCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  });

  it("should correctly limit and order feed status rows", async () => {
    const expectedOrder = [
      "Operator 6",
      "Operator 5",
      "Operator 4",
      "Operator 3",
      "Operator 1",
    ];
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts),
    );

    spectator.detectChanges();

    const statusRows = spectator.queryAll(".feed-status-summary tbody tr");

    expect(statusRows).toHaveLength(expectedOrder.length);

    const opNames = statusRows.map((row) =>
      row.querySelector(".feed-status-summary__operator")?.textContent?.trim(),
    );

    await expect(opNames).toEqual(
      jasmine.arrayWithExactContents(expectedOrder),
    );
  });

  it("should show count of alerts and errors in feed status row", async () => {
    spyOnProperty(service, "listOperators").and.returnValue(
      of([operator2, operator6]),
    );
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of([operator2VehicleCounts, operator6VehicleCounts]),
    );

    spectator.detectChanges();

    const statusRows = spectator.queryAll(".feed-status-summary tbody tr");

    expect(statusRows).toHaveLength(2);

    const op6statusRow = spectator.query(
      byTextContent(/Operator 6/, {
        selector: ".feed-status-summary tbody tr",
      }),
    );

    await expect(op6statusRow).toBeTruthy();

    expect(
      op6statusRow?.querySelector(
        ".feed-status-summary__status .status--active",
      ),
    ).not.toExist();
    expect(
      op6statusRow?.querySelector(
        ".feed-status-summary__status .status--inactive",
      ),
    ).toExist();

    const op2statusRow = spectator.query(
      byTextContent(/Operator 2/, {
        selector: ".feed-status-summary tbody tr",
      }),
    );

    await expect(op2statusRow).toBeTruthy();

    expect(
      op2statusRow?.querySelector(
        ".feed-status-summary__status .status--active",
      ),
    ).toExist();
    expect(
      op2statusRow?.querySelector(
        ".feed-status-summary__status .status--inactive",
      ),
    ).not.toExist();
  });

  it("should set nocCode on punctuality component", async () => {
    const punc = spectator.query(PerformanceComponent);

    expect(punc).toExist();

    spectator.detectChanges();

    await expect(punc?.nocCode).toBeNull();

    spectator.setRouteQueryParam("nocCode", "OP01");

    spectator.detectChanges();

    await expect(punc?.nocCode).toEqual("OP01");
  });

  it("should display feed status before vehicle count has finished loading", fakeAsync(() => {
    const expectedCount = 124;
    spyOnProperty(service, "listOperators").and.returnValue(of(operatorList));
    spyOnProperty(service, "listOperatorVehicleCounts").and.returnValue(
      of(vehicleCounts).pipe(delay(100)),
    );

    spectator.detectChanges();

    const statusRows = spectator.queryAll(".feed-status-summary tbody tr");

    expect(statusRows).toHaveLength(5);

    expect(
      spectator.query(
        byTextContent(new RegExp(`Expected\\w*0`), { selector: ".stat" }),
      ),
    ).toExist();

    tick(100);
    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(`Expected\\w*${expectedCount}`), {
          selector: ".stat",
        }),
      ),
    ).toExist();
  }));
});
