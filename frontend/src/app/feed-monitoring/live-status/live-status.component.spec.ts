import { Router } from '@angular/router';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { fakeOperatorLiveStatus } from 'src/test-support/faker';
import { FeedMonitoringService } from '../feed-monitoring.service';

import { LiveStatusComponent } from './live-status.component';
import * as Faker from 'faker';

import { byText, byTextContent, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { OperatorLiveStatusFragment } from 'src/generated/graphql';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { AlertListComponent } from '../alert-list/alert-list.component';
import { MockLiveVehicleStatsComponent } from './live-vehicle-stats/mock-live-vehicle-stats.component';
import { Interval, Settings } from 'luxon';
import { LuxonModule } from 'luxon-angular';

describe('LiveStatusComponent', () => {
  let spectator: SpectatorRouting<LiveStatusComponent>;
  let service: FeedMonitoringService;

  const createComponent = createRoutingFactory({
    component: LiveStatusComponent,
    declarations: [LiveStatusComponent, AlertListComponent, MockLiveVehicleStatsComponent],
    imports: [FormsModule, LayoutModule, SharedModule, ApolloTestingModule, NgSelectModule, LuxonModule],
    providers: [FeedMonitoringService],
    detectChanges: false,
    stubsEnabled: false,
  });
  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    service = spectator.inject(FeedMonitoringService);
  });

  beforeAll(async () => {
    Faker.seed(534534);
  });

  it('should set operator from params', () => {
    const operator = fakeOperatorLiveStatus(true);

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    expect(service.fetchOperator).toHaveBeenCalledWith(operator.operatorId as string);

    expect(spectator.component.operator).toEqual(operator);
  });

  it(`should show operator name`, () => {
    const operator = fakeOperatorLiveStatus(true);

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    const operatorName = spectator.query(
      byTextContent(`${operator.name} (${operator.nocCode as string})`, { selector: '.govuk-caption-l' })
    );

    expect(operatorName).toBeTruthy();
  });

  it(`should show not allow operator to be changed if there's only one`, () => {
    const operator = fakeOperatorLiveStatus(true);

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    const operatorSelect = spectator.query(NgSelectComponent);

    expect(operatorSelect).toBeFalsy();
  });

  [0, 1, 2].map((inx) =>
    it(`should load with correct operator selected`, async () => {
      const operators = [fakeOperatorLiveStatus(true), fakeOperatorLiveStatus(true), fakeOperatorLiveStatus(true)];

      const theoperator = operators[inx];
      spyOnProperty(service, 'listOperators').and.returnValue(of(operators));
      spyOn(service, 'fetchOperator').and.returnValue(of(theoperator));

      await spectator.fixture.whenStable();

      spectator.setRouteParam('nocCode', theoperator.nocCode as string);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const operatorSelect = spectator.query(NgSelectComponent);

      expect(operatorSelect).toBeTruthy();

      expect(operatorSelect?.selectedValues).toEqual([theoperator.nocCode]);
    })
  );

  it(`should show allow operator to be changed`, async () => {
    const operator = fakeOperatorLiveStatus(true);
    const otheroperator = fakeOperatorLiveStatus(true);

    otheroperator.name = 'Other operator';

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator, otheroperator]));
    spyOn(service, 'fetchOperator').and.callFake((noc) => {
      switch (noc) {
        case operator.nocCode:
          return of(operator);
        case otheroperator.nocCode:
          return of(otheroperator);
      }

      return of({} as OperatorLiveStatusFragment);
    });

    await spectator.fixture.whenStable();

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const operatorSelect = spectator.query(NgSelectComponent);

    expect(operatorSelect).toBeTruthy();

    await spectator.fixture.whenStable();

    const router = spectator.inject(Router);
    spyOn(router, 'navigate');

    if (operatorSelect) {
      operatorSelect.open();
      operatorSelect.select(operatorSelect.itemsList.items[1]);
    }

    spectator.detectChanges();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([otheroperator.nocCode], jasmine.objectContaining({}));
  });

  const testCases = [
    { active: true, status: 'active' },
    { active: false, status: 'inactive' },
  ];
  testCases.forEach(({ active, status }) => {
    it(`should show operator ${status} status`, () => {
      const operator = fakeOperatorLiveStatus(active);

      spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
      spyOn(service, 'fetchOperator').and.returnValue(of(operator));

      spectator.setRouteParam('nocCode', operator.nocCode as string);

      spectator.detectChanges();

      expect(
        spectator.query(byTextContent(new RegExp(status), { selector: '#live-stat-status .stat__value' }))
      ).toBeTruthy();
    });
  });

  it(`should show operator current vehicles`, () => {
    const operator = fakeOperatorLiveStatus(true);
    operator.feedMonitoring.liveStats.currentVehicles = 1732;

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^1732$/, {
          selector: '#live-stat-current .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it(`should show operator expected vehicles`, () => {
    const operator = fakeOperatorLiveStatus(true);
    operator.feedMonitoring.liveStats.expectedVehicles = 437;

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^437$/, {
          selector: '#live-stat-expected .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it(`should show operator update frequency`, () => {
    const operator = fakeOperatorLiveStatus(true);
    operator.feedMonitoring.liveStats.updateFrequency = 56;
    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^56s$/, {
          selector: '#live-stat-frequency .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it(`should show a not found message if operator fails to load, but with no errors`, () => {
    spyOnProperty(service, 'listOperators').and.returnValue(of([]));
    spyOn(service, 'fetchOperator').and.returnValue(of(null));

    spectator.setRouteParam('nocCode', 'NOCNOC');

    spectator.detectChanges();

    expect(spectator.query(byText(/Not found/))).toBeTruthy();
  });

  it('should show an error message if operator fails to load, with errors', () => {
    spyOnProperty(service, 'listOperators').and.returnValue(of([]));
    spyOn(service, 'fetchOperator').and.throwError('There was an error');

    spectator.setRouteParam('nocCode', 'NOCNOC');

    spectator.detectChanges();

    expect(spectator.query(byText(/There was an error loading the operator data/))).toBeTruthy();
  });

  it('should specify intervals for last 24 hours and last 20 minutes charts', () => {
    const operator = fakeOperatorLiveStatus(true);

    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', 'NOCNOC');
    spectator.detectChanges();

    expect(spectator.component.intervalLast24Hours).toEqual(Interval.fromISO('P1D/2022-08-01T00:00:00'));
    expect(spectator.component.intervalLast20Minutes).toEqual(Interval.fromISO('PT20M/2022-08-01T00:00:00'));
  });

  it(`should show message with link to BODS when expected vehicles equals 0`, () => {
    const operator = fakeOperatorLiveStatus(true);
    operator.feedMonitoring.liveStats.expectedVehicles = 0;
    spyOnProperty(service, 'listOperators').and.returnValue(of([operator]));
    spyOn(service, 'fetchOperator').and.returnValue(of(operator));

    spectator.setRouteParam('nocCode', operator.nocCode as string);

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(
          'If the number of expected vehicles is zero and you were expecting vehicles, please check your BODS timetables are up to date here.',
          { selector: '.govuk-inset-text' }
        )
      )
    ).toBeVisible();

    expect(spectator.query('.govuk-inset-text .govuk-link')?.getAttribute('href')).toContain(
      `https://data.bus-data.dft.gov.uk/timetable/?q=${operator.nocCode}`
    );
  });
});
