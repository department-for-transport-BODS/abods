import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { byLabel, byRole, byText, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { dateTimeEqualityMatcher } from 'src/test-support/equality';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { ViewServiceComponent } from './view-service.component';
import { OnTimeService, PerformanceParams, PunctualityOverview } from '../on-time.service';
import { HeadwayService } from '../headway.service';
import { FiltersComponent } from '../filters/filters.component';
import { ChartNoDataWrapperComponent } from '../chart-no-data-wrapper/chart-no-data-wrapper.component';
import { ControlsComponent } from '../controls/controls.component';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { OperatorService } from '../../shared/services/operator.service';
import { waitForAsync } from '@angular/core/testing';
import { PerformanceService } from '../performance.service';
import { cloneDeep } from 'lodash-es';

describe('ViewServiceComponent', () => {
  let spectator: SpectatorRouting<ViewServiceComponent>;
  let component: ViewServiceComponent;
  let operatorService: OperatorService;
  let onTimeService: OnTimeService;
  let headwayService: HeadwayService;
  let performanceService: PerformanceService;

  const createComponent = createRoutingFactory({
    component: ViewServiceComponent,
    declarations: [FiltersComponent, ChartNoDataWrapperComponent, ControlsComponent],
    imports: [LayoutModule, SharedModule, FormsModule, ReactiveFormsModule, ApolloTestingModule],
    providers: [
      MockProvider(OnTimeService, {
        fetchOnTimeStats: () => throwError(true),
      }),
    ],
    detectChanges: false,
    stubsEnabled: false,
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    operatorService = spectator.inject(OperatorService);
    onTimeService = spectator.inject(OnTimeService);
    headwayService = spectator.inject(HeadwayService);
    performanceService = spectator.inject(PerformanceService);

    spyOn(operatorService, 'fetchOperators').and.returnValue(
      of([{ nocCode: 'ABCD', operatorId: 'OP01', name: 'Operator 1', adminAreaIds: [] }])
    );
    spyOn(operatorService, 'fetchOperator').and.returnValue(
      of({ nocCode: 'ABCD', operatorId: 'OP01', name: 'Operator 1', adminAreaIds: [] })
    );
  });

  it('should create', () => {
    spectator.setRouteParam('nocCode', 'ABCD');

    expect(component).toBeTruthy();
  });

  it('should not show operator selector on operator list page', () => {
    expect(spectator.query(byRole('combobox'))).not.toBeVisible();
  });

  it('should show line not found message', () => {
    spyOn(onTimeService, 'fetchServiceInfo').and.returnValue(throwError({}));

    spectator.setRouteParam('nocCode', 'ABCD');
    spectator.setRouteParam('lineId', 'LN12345');

    expect(spectator.query(byText(/Not found/))).toBeTruthy();
  });

  it(
    'should show line data where a lineId is specified',
    waitForAsync(async () => {
      const spy = spyOn(onTimeService, 'fetchServiceInfo').and.returnValue(
        of({ serviceName: 'Sheffield to Mansfield', serviceNumber: '53', serviceId: 'XYZ' })
      );

      spectator.setRouteParam('nocCode', 'ABCD');
      spectator.setRouteParam('lineId', 'LN12345');

      component.params$.next({
        filters: {
          operatorIds: ['OP01'],
          lineIds: ['LN12345'],
        },
        fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
        toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
      });

      await spectator.fixture.whenStable();

      expect(spy).toHaveBeenCalledWith('LN12345');
      expect(spectator.query(byText('53 - Sheffield to Mansfield'))).toBeVisible();
    })
  );

  it('should display no timetabled error message', () => {
    spyOn(onTimeService, 'fetchOnTimeStats').and.returnValue(
      of({
        completed: 0,
        scheduled: 0,
      } as PunctualityOverview)
    );

    const nocCode = 'ABCD';

    spectator.setRouteParam('nocCode', nocCode);
    component.params$.next({
      filters: {
        operatorIds: ['OP01'],
      },
      fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
    });
    component.tabs?.openTab('distribution');

    spectator.detectChanges();

    expect(
      spectator.query(byText(/We have not found any timetable data for the time period and filters selected\./))
    ).toBeVisible();
  });

  it('should display no data error message', () => {
    spyOn(onTimeService, 'fetchOnTimeStats').and.returnValue(
      of({
        completed: 0,
        scheduled: 100,
      } as PunctualityOverview)
    );

    const nocCode = 'ABCD';

    spectator.setRouteParam('nocCode', nocCode);
    component.tabs?.openTab('distribution');

    spectator.detectChanges();

    expect(
      spectator.query(
        byText(/We have not received any vehicle location data for the time period and filters selected\./)
      )
    ).toBeVisible();
  });

  it('should not show mode selector for services that do not run frequently', async () => {
    spyOn(onTimeService, 'fetchServiceInfo').and.returnValue(
      of({ serviceName: 'Sheffield to Mansfield', serviceNumber: '53', serviceId: 'XYZ' })
    );

    const params = {
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      },
      fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
    };

    const spy = spyOn(headwayService, 'fetchFrequentServiceInfo').and.returnValue(of({ numHours: 0, totalHours: 100 }));

    spectator.setRouteParam('nocCode', 'ABCD');
    spectator.setRouteParam('lineId', 'LN12345');

    component.params$.next(params);

    spectator.click(byText('Timeline'));
    spectator.detectChanges();

    await spectator.fixture.whenStable();

    expect(spy).toHaveBeenCalledWith(params);
    expect(spectator.query(byLabel('Show:'))).not.toBeVisible();
    expect(
      spectator.query(
        byText(
          '0 hours out of a total 100 service hours during the selected period operated on a frequent service basis. Excess Waiting Time is averaged over the period in which the service is running on a frequent basis.'
        )
      )
    ).not.toBeVisible();
  });

  it('should show mode selector for services that do run frequently', async () => {
    spyOn(onTimeService, 'fetchServiceInfo').and.returnValue(
      of({ serviceName: 'Sheffield to Mansfield', serviceNumber: '53', serviceId: 'XYZ' })
    );

    const spy = spyOn(headwayService, 'fetchFrequentServiceInfo').and.returnValue(
      of({ numHours: 50, totalHours: 100 })
    );

    spectator.setRouteParam('nocCode', 'ABCD');
    spectator.setRouteParam('lineId', 'LN12345');

    const params = {
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      },
      fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
    };

    component.params$.next(params);

    spectator.click(byText('Timeline'));
    spectator.detectChanges();

    await spectator.fixture.whenStable();

    expect(spy).toHaveBeenCalledWith(params);
    expect(spectator.query(byLabel('Show:'))).toBeVisible();
  });

  it('should show summary of frequent service', async () => {
    spyOn(onTimeService, 'fetchServiceInfo').and.returnValue(
      of({ serviceName: 'Sheffield to Mansfield', serviceNumber: '53', serviceId: 'XYZ' })
    );

    spyOn(headwayService, 'fetchFrequentServiceInfo').and.returnValue(of({ numHours: 50, totalHours: 100 }));

    spectator.setRouteParam('nocCode', 'ABCD');
    spectator.setRouteParam('lineId', 'LN12345');

    component.params$.next({
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      },
      fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
    });

    await spectator.fixture.whenRenderingDone();

    spectator.click(byText('Timeline'));
    spectator.detectChanges();

    await spectator.fixture.whenStable();

    component.overviewMode = 'excess-wait-time';
    spectator.detectChanges();

    await spectator.fixture.whenStable();

    expect(
      spectator.query(
        byText(
          '50 hours out of a total 100 service hours during the selected period operated on a frequent service basis. Excess Waiting Time is averaged over the period in which the service is running on a frequent basis.'
        )
      )
    ).toBeVisible();
  });

  it('should not call fetchOverviewStats with adminAreaIds', async () => {
    spyOn(performanceService, 'fetchOverviewStats').and.callThrough();

    const params: PerformanceParams = {
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
        adminAreaIds: ['AA050'],
      },
      fromTimestamp: DateTime.fromISO('2021-01-01T00:00:00').toJSDate(),
      toTimestamp: DateTime.fromISO('2021-02-01T00:00:00').toJSDate(),
    };
    const expectedParams = cloneDeep(params);
    delete expectedParams.filters.adminAreaIds;

    component.params$.next(params);

    spectator.detectChanges();

    await spectator.fixture.whenStable();

    expect(performanceService.fetchOverviewStats).toHaveBeenCalledWith(expectedParams);
  });
});
