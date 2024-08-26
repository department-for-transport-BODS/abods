import { byText, byTextContent, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { OperatorFeedHistoryFragment } from 'src/generated/graphql';
import { FeedMonitoringModule } from '../feed-monitoring.module';
import { FeedMonitoringService } from '../feed-monitoring.service';
import { DatenavItemComponent } from './datenav/datenav-item/datenav-item.component';
import { FeedHistoryComponent } from './feed-history.component';

describe('FeedHistoryComponent', () => {
  let spectator: SpectatorRouting<FeedHistoryComponent>;
  const createComponent = createRoutingFactory({
    component: FeedHistoryComponent,
    imports: [SharedModule, LayoutModule, FeedMonitoringModule, ApolloTestingModule],
    detectChanges: false,
  });
  let component: FeedHistoryComponent;
  let service: FeedMonitoringService;

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(FeedMonitoringService);

    spyOnProperty(service, 'listOperators', 'get').and.returnValue(of([{ nocCode: 'NOCODE', operatorId: 'OP01' }]));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should default date to yesterday', () => {
    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.detectChanges();

    expect(spectator.router.navigate).toHaveBeenCalledWith(
      ['.'],
      jasmine.objectContaining({ queryParams: { date: DateTime.local().minus({ day: 1 }).toFormat('yyyy-MM-dd') } })
    );
  });

  it('should take date from query string', () => {
    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');
    spectator.detectChanges();

    expect(component.date).toEqual(DateTime.local(2020, 5, 4));
  });

  it('should load data for nocCode and date', () => {
    spyOn(service, 'fetchOperatorHistory').and.returnValue(
      of({
        nocCode: 'NOCODE',
        name: 'no',
        feedMonitoring: {
          historicalStats: {},
          vehicleStats: [],
        },
      })
    );

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(service.fetchOperatorHistory).toHaveBeenCalledTimes(1);
    expect(service.fetchOperatorHistory).toHaveBeenCalledWith('OP01', DateTime.local(2020, 5, 4));
  });

  it('should show selected date', () => {
    spyOn(service, 'fetchAlertStats').and.returnValue(
      of([
        { count: 3, day: '2020-11-23' },
        { count: 11, day: '2020-11-24' },
        { count: 1, day: '2020-11-25' },
      ])
    );
    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(spectator.query(byText('4 May 2020'))).toBeTruthy();
  });

  it('should show heatmap date nav and be interactive', () => {
    spyOn(service, 'fetchAlertStats').and.returnValue(
      of([
        { count: 8, day: '2020-11-19' },
        { count: 12, day: '2020-11-20' },
        { count: 10, day: '2020-11-21' },
        { count: 6, day: '2020-11-22' },
        { count: 4, day: '2020-11-23' },
        { count: 0, day: '2020-11-24' },
        { count: 2, day: '2020-11-25' },
      ])
    );

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-11-25');

    spectator.detectChanges();

    const navitems = spectator.queryAll(DatenavItemComponent);

    expect(navitems).toHaveLength(7);

    expect(navitems[5].heat).toBe(0);

    expect(navitems[1].heat).toBe(6);
    expect(navitems[1].date).toEqual(DateTime.local(2020, 11, 20));

    spectator.click(byText('20 November'));

    spectator.detectChanges();

    expect(spectator.router.navigate).toHaveBeenCalledWith(
      ['.'],
      jasmine.objectContaining({ queryParams: jasmine.objectContaining({ date: '2020-11-20' }) })
    );
  });

  it('should show "not found" if operator not loaded', () => {
    spyOn(service, 'fetchOperatorHistory').and.returnValue(of(null));

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(spectator.query(byText(/Not found/))).toBeTruthy();
  });

  it('should show not "not found" if operator not loaded, but with errors', async () => {
    spyOn(service, 'fetchOperatorHistory').and.throwError('Some error');

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(spectator.query(byText(/Not found/))).toBeFalsy();
    expect(spectator.query(byText(/There was an error/))).toBeTruthy();
  });

  it('should show "no data" if operator loaded, but with no stats', () => {
    const operator: OperatorFeedHistoryFragment = {
      nocCode: 'NOCODE',
      feedMonitoring: {
        historicalStats: {},
        vehicleStats: [],
      },
    };
    spyOn(service, 'fetchOperatorHistory').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(spectator.query(byText(/Not found/))).toBeFalsy();
    expect(spectator.query(byText(/There was an error/))).toBeFalsy();
    expect(spectator.query(byText(/No data/))).toBeTruthy();
  });

  it('should set vehicleStats for chart', () => {
    const operator: OperatorFeedHistoryFragment = {
      nocCode: 'NOCODE',
      feedMonitoring: {
        historicalStats: {},
        vehicleStats: [
          { timestamp: '2022-01-03', expected: 10, actual: 10 },
          { timestamp: '2022-01-04', expected: 9, actual: 8 },
          { timestamp: '2022-01-05', expected: 15, actual: 3 },
        ],
      },
    };
    spyOn(service, 'fetchOperatorHistory').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', 'NOCODE');
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(spectator.component.vehicleStats).toEqual(operator.feedMonitoring.vehicleStats);
  });

  it(`should show operator update frequency`, () => {
    const operator: OperatorFeedHistoryFragment = {
      nocCode: 'NOCNOC',
      feedMonitoring: {
        historicalStats: {
          updateFrequency: 43,
        },
        vehicleStats: [],
      },
    };
    spyOn(service, 'fetchOperatorHistory').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^43s$/, {
          selector: '#historic-stat-frequency .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it(`should show operator feed availability`, () => {
    const operator: OperatorFeedHistoryFragment = {
      nocCode: 'NOCNOC',
      feedMonitoring: {
        historicalStats: {
          availability: 99.99,
        },
        vehicleStats: [],
      },
    };

    spyOn(service, 'fetchOperatorHistory').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);
    spectator.setRouteQueryParam('date', '2020-05-04');

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^99.99%$/, {
          selector: '#historic-stat-availability .stat__value',
        })
      )
    ).toBeTruthy();
  });
});
