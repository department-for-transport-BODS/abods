import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardService } from '../dashboard.service';
import { MockPerformanceChartComponent } from './chart/mock-chart.component';
import { PerformanceComponent } from './performance.component';
import * as faker from 'faker';
import { cold, getTestScheduler } from 'jasmine-marbles';
import { PerformanceRankingComponent } from './ranking-table/ranking-table.component';
import { PerformanceFiltersInputType, RankingOrder, ServicePunctualityType } from 'src/generated/graphql';
import { fakeDashboardPunctualityStats, fakeDashboardServiceRanking } from 'src/test-support/faker';
import { DateRangeService } from 'src/app/shared/services/date-range.service';
import { dateTimeCloseEnoughToEqualityMatcher } from 'src/test-support/equality';
import { Period } from 'src/app/shared/components/date-range/date-range.types';
import { BehaviorSubject } from 'rxjs';

describe('PerformanceComponent', () => {
  let spectator: Spectator<PerformanceComponent>;
  let component: PerformanceComponent;
  let service: DashboardService;
  let dateRange: DateRangeService;

  const filters = <PerformanceFiltersInputType>{};

  const createComponent = createComponentFactory({
    component: PerformanceComponent,
    declarations: [MockPerformanceChartComponent, PerformanceRankingComponent],
    imports: [LayoutModule, SharedModule, RouterTestingModule, ApolloTestingModule],
    detectChanges: false,
  });

  beforeAll(() => {
    faker.seed(92038);
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(DashboardService);
    dateRange = spectator.inject(DateRangeService);
    component.filters = new BehaviorSubject(filters);
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeCloseEnoughToEqualityMatcher);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toExist();
  });

  it('should fetch stats for all operators for last month', () => {
    const getPunctualityStatsSpy = spyOn(service, 'getPunctualityStats').and.returnValue(
      cold('-a', { a: fakeDashboardServiceRanking() })
    );
    const getServiceRankingSpy = spyOn(service, 'getServiceRanking').and.returnValue(cold('-a', { a: [] }));

    const startOfLastMonth = DateTime.fromISO('2021-02-01T00:00:00Z');
    const endOfLastMonth = DateTime.fromISO('2021-02-28T23:59:59.999Z');

    const startOfMonthBefore = DateTime.fromISO('2021-01-01T00:00:00Z');
    const endOfMonthBefore = DateTime.fromISO('2021-01-31T23:59:59.999Z');

    const changePeriodFromTimeSpy = spyOn(dateRange, 'calculatePresetPeriod').and.returnValue({
      from: startOfLastMonth,
      to: endOfLastMonth,
      trendFrom: startOfMonthBefore,
      trendTo: endOfMonthBefore,
      preset: Period.LastMonth,
    });

    spectator.detectChanges();

    spectator.selectOption('#period', 'lastMonth');

    spectator.detectChanges();

    getTestScheduler().flush();
    spectator.detectChanges();

    expect(changePeriodFromTimeSpy).toHaveBeenCalledWith(Period.LastMonth, DateTime.local());

    expect(getPunctualityStatsSpy).toHaveBeenCalledWith(filters, startOfLastMonth, endOfLastMonth);

    expect(getServiceRankingSpy).toHaveBeenCalledWith(
      filters,
      startOfLastMonth,
      endOfLastMonth,
      RankingOrder.Descending,
      startOfMonthBefore,
      endOfMonthBefore
    );
  });

  it('should fetch stats for specific operator', () => {
    const getPunctualityStatsSpy = spyOn(service, 'getPunctualityStats').and.returnValue(
      cold('-a', { a: fakeDashboardServiceRanking() })
    );
    const getServiceRankingSpy = spyOn(service, 'getServiceRanking').and.returnValue(cold('-a', { a: [] }));

    filters.nocCodes = ['OP01'];
    component.filters = new BehaviorSubject(filters);

    const testNow = DateTime.fromISO('2021-03-30T10:01:00Z');

    const twentyEightDaysBefore = DateTime.fromISO('2021-02-03T10:01:00Z');
    const fiftySixDaysBefore = DateTime.fromISO('2021-01-06T10:01:00Z');

    const changePeriodFromTimeSpy = spyOn(dateRange, 'calculatePresetPeriod').and.returnValue({
      from: twentyEightDaysBefore,
      to: testNow,
      trendFrom: fiftySixDaysBefore,
      trendTo: testNow,
      preset: Period.Last7,
    });

    spectator.detectChanges();

    getTestScheduler().flush();
    spectator.detectChanges();

    expect(changePeriodFromTimeSpy).toHaveBeenCalledWith(Period.Last7, DateTime.local());

    expect(getPunctualityStatsSpy).toHaveBeenCalledWith(filters, twentyEightDaysBefore, testNow);

    expect(getServiceRankingSpy).toHaveBeenCalledWith(
      filters,
      twentyEightDaysBefore,
      testNow,
      RankingOrder.Descending,
      fiftySixDaysBefore,
      testNow
    );
  });

  it('should pass stats to chart component', () => {
    const stats = fakeDashboardPunctualityStats();
    spyOn(service, 'getPunctualityStats').and.returnValue(cold('-a', { a: { success: true, result: stats } }));
    spyOn(service, 'getServiceRanking').and.returnValue(cold('-a', { a: [] }));

    spectator.detectChanges();

    getTestScheduler().flush();
    spectator.detectChanges();
    const mockChart = spectator.query(MockPerformanceChartComponent);

    expect(mockChart).toExist();

    expect(mockChart?.sourceData).toEqual(stats);
  });

  it('should pass ranking to ranking component', () => {
    const ranking: ServicePunctualityType[] = [
      fakeDashboardServiceRanking(),
      fakeDashboardServiceRanking(),
      fakeDashboardServiceRanking(),
    ];
    spyOn(service, 'getPunctualityStats').and.returnValue(
      cold('-a', { a: { success: true, result: fakeDashboardServiceRanking() } })
    );
    spyOn(service, 'getServiceRanking').and.returnValue(cold('-a', { a: ranking }));

    spectator.detectChanges();

    getTestScheduler().flush();
    spectator.detectChanges();
    const rankingComponent = spectator.query(PerformanceRankingComponent);

    expect(rankingComponent).toExist();

    expect(rankingComponent?.services).toEqual(ranking);
  });
});
