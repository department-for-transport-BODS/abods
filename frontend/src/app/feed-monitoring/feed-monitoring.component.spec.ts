import { ComponentFixture, TestBed } from "@angular/core/testing";

import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApolloTestingModule } from "apollo-angular/testing";
import { cold, getTestScheduler } from "jasmine-marbles";
import { of } from "rxjs";
import { OperatorLiveStatusFragment } from "src/generated/graphql";
import { fakeOperatorLiveStatus } from "src/test-support/faker";
import { FeedMonitoringComponent } from "./feed-monitoring.component";
import { FeedMonitoringModule } from "./feed-monitoring.module";
import { FeedMonitoringService } from "./feed-monitoring.service";

describe("FeedMonitoringComponent", () => {
  const inactiveOperators = [
    fakeOperatorLiveStatus(false),
    fakeOperatorLiveStatus(false),
  ];
  const activeOperators = [
    fakeOperatorLiveStatus(true),
    fakeOperatorLiveStatus(true),
    fakeOperatorLiveStatus(true),
  ];

  let component: FeedMonitoringComponent;
  let fixture: ComponentFixture<FeedMonitoringComponent>;
  let service: FeedMonitoringService;
  let router: Router;
  let route: ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        ApolloTestingModule,
        FeedMonitoringModule,
      ],
      declarations: [FeedMonitoringComponent],
    }).compileComponents();
    service = TestBed.inject(FeedMonitoringService);
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);

    spyOn(router, "navigate").and.resolveTo(true);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedMonitoringComponent);
    component = fixture.componentInstance;
  });

  it("should create", async () => {
    fixture.detectChanges();

    await expect(component).toBeTruthy();
  });

  it("should fetch", () => {
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(of([]));

    fixture.detectChanges();

    expect(service.fetchFeedMonitoringList).toHaveBeenCalledWith();
  });

  it("should display inactive operator table", async () => {
    const data = inactiveOperators;

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(
      By.css(".feed-monitoring__inactive-grid"),
    );

    await expect(inactiveGrid).toBeTruthy();

    const headers = inactiveGrid
      .queryAll(By.css(".ag-header-cell-text"))
      .map((x) => (x.nativeElement as { innerHTML: string }).innerHTML);

    await expect(headers).toEqual(
      jasmine.arrayContaining([
        "Operator",
        "Feed availability",
        "Update frequency",
        "Unavailable since",
      ]),
    );
  });

  it("should display data in inactive operator table", async () => {
    const data = inactiveOperators;

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(
      By.css(".feed-monitoring__inactive-grid"),
    );

    await expect(inactiveGrid).toBeTruthy();
    const row0 = inactiveGrid.query(By.css('[role="row"][row-index="0"]'));

    await expect(row0).toBeTruthy();

    const row1 = inactiveGrid.query(By.css('[role="row"][row-index="1"]'));

    await expect(row1).toBeTruthy();

    const row2 = inactiveGrid.query(By.css('[role="row"][row-index="2"]'));

    await expect(row2).toBeFalsy();
  });

  it("should not display inactive operator table if none inactive", async () => {
    const data: OperatorLiveStatusFragment[] = activeOperators;

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(
      By.css(".feed-monitoring__inactive-grid"),
    );

    await expect(inactiveGrid).toBeFalsy();
  });

  it("should display active operator table", async () => {
    const data: OperatorLiveStatusFragment[] = activeOperators;

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(
      By.css(".feed-monitoring__active-grid"),
    );

    await expect(inactiveGrid).toBeTruthy();

    const headers = inactiveGrid
      .queryAll(By.css(".ag-header-cell-text"))
      .map((x) => (x.nativeElement as { innerHTML: string }).innerHTML);

    await expect(headers).toEqual(
      jasmine.arrayContaining([
        "Operator",
        "Feed availability",
        "Update frequency",
        "Last outage",
      ]),
    );
  });

  it("should display data in active operator table", async () => {
    const data = activeOperators;

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const activeGrid = fixture.debugElement.query(
      By.css(".feed-monitoring__active-grid"),
    );

    await expect(activeGrid).toBeTruthy();
    const row0 = activeGrid.query(By.css('[role="row"][row-index="0"]'));

    await expect(row0).toBeTruthy();

    const row1 = activeGrid.query(By.css('[role="row"][row-index="1"]'));

    await expect(row1).toBeTruthy();

    const row2 = activeGrid.query(By.css('[role="row"][row-index="2"]'));

    await expect(row2).toBeTruthy();
  });

  it("should navigate to live status if only one operator", async () => {
    const operator = fakeOperatorLiveStatus(true);
    const data: OperatorLiveStatusFragment[] = [operator];

    const ops = cold("--a", {
      a: data,
    });
    spyOn(service, "fetchFeedMonitoringList").and.returnValue(ops);

    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    await expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      [operator.nocCode],
      jasmine.objectContaining({ relativeTo: route }),
    );
  });
});
