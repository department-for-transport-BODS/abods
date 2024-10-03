import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedMonitoringComponent } from './feed-monitoring.component';
import { FeedMonitoringModule } from './feed-monitoring.module';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FeedMonitoringService } from './feed-monitoring.service';
import { fakeOperatorLiveStatus } from 'src/test-support/faker';
import { cold, getTestScheduler } from 'jasmine-marbles';
import { By } from '@angular/platform-browser';
import { OperatorLiveStatusFragment } from 'src/generated/graphql';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

describe('FeedMonitoringComponent', () => {
  const inactiveOperators = [fakeOperatorLiveStatus(false), fakeOperatorLiveStatus(false)];
  const activeOperators = [fakeOperatorLiveStatus(true), fakeOperatorLiveStatus(true), fakeOperatorLiveStatus(true)];

  let component: FeedMonitoringComponent;
  let fixture: ComponentFixture<FeedMonitoringComponent>;
  let service: FeedMonitoringService;
  let router: Router;
  let route: ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, ApolloTestingModule, FeedMonitoringModule],
      declarations: [FeedMonitoringComponent],
    }).compileComponents();
    service = TestBed.inject(FeedMonitoringService);
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedMonitoringComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should fetch', async () => {
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(of([]));

    fixture.detectChanges();

    expect(service.fetchFeedMonitoringList).toHaveBeenCalledWith();
  });

  it('should display inactive operator table', async () => {
    const data = inactiveOperators;

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(By.css('.feed-monitoring__inactive-grid'));

    expect(inactiveGrid).toBeTruthy();

    const headers = inactiveGrid.queryAll(By.css('.ag-header-cell-text')).map((x) => x.nativeElement.innerHTML);

    expect(headers).toEqual(
      jasmine.arrayContaining(['Operator', 'Feed availability', 'Update frequency', 'Unavailable since'])
    );
  });

  it('should display data in inactive operator table', async () => {
    const data = inactiveOperators;

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(By.css('.feed-monitoring__inactive-grid'));

    expect(inactiveGrid).toBeTruthy();
    const row0 = inactiveGrid.query(By.css('[role="row"][row-index="0"]'));

    expect(row0).toBeTruthy();

    const row1 = inactiveGrid.query(By.css('[role="row"][row-index="1"]'));

    expect(row1).toBeTruthy();

    const row2 = inactiveGrid.query(By.css('[role="row"][row-index="2"]'));

    expect(row2).toBeFalsy();
  });

  it('should not display inactive operator table if none inactive', async () => {
    const data: OperatorLiveStatusFragment[] = activeOperators;

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(By.css('.feed-monitoring__inactive-grid'));

    expect(inactiveGrid).toBeFalsy();
  });

  it('should display active operator table', async () => {
    const data: OperatorLiveStatusFragment[] = activeOperators;

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const inactiveGrid = fixture.debugElement.query(By.css('.feed-monitoring__active-grid'));

    expect(inactiveGrid).toBeTruthy();

    const headers = inactiveGrid.queryAll(By.css('.ag-header-cell-text')).map((x) => x.nativeElement.innerHTML);

    expect(headers).toEqual(
      jasmine.arrayContaining(['Operator', 'Feed availability', 'Update frequency', 'Last outage'])
    );
  });

  it('should display data in active operator table', async () => {
    const data = activeOperators;

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);
    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    const activeGrid = fixture.debugElement.query(By.css('.feed-monitoring__active-grid'));

    expect(activeGrid).toBeTruthy();
    const row0 = activeGrid.query(By.css('[role="row"][row-index="0"]'));

    expect(row0).toBeTruthy();

    const row1 = activeGrid.query(By.css('[role="row"][row-index="1"]'));

    expect(row1).toBeTruthy();

    const row2 = activeGrid.query(By.css('[role="row"][row-index="2"]'));

    expect(row2).toBeTruthy();
  });

  it('should navigate to live status if only one operator', () => {
    const operator = fakeOperatorLiveStatus(true);
    const data: OperatorLiveStatusFragment[] = [operator];

    const ops = cold('--a', {
      a: data,
    });
    spyOn(service, 'fetchFeedMonitoringList').and.returnValue(ops);

    spyOn(router, 'navigate');

    fixture.detectChanges();

    getTestScheduler().flush();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([operator.nocCode], jasmine.objectContaining({ relativeTo: route }));
  });
});
