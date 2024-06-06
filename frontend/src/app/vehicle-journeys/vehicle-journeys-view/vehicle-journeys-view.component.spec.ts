import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { byTextContent, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { MockComponent } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { LayoutModule } from '../../layout/layout.module';
import { SharedModule } from '../../shared/shared.module';
import { toUrlDateFormat } from '../../shared/url-helper';
import { JourneyInfoComponent } from './journey-info/journey-info.component';
import { mockVehicleStopPingFactory } from './stop-list/stop-item/stop-item.component.spec';
import { StopListComponent } from './stop-list/stop-list.component';

import { VehicleJourneysViewComponent } from './vehicle-journeys-view.component';
import { VehicleJourneysViewService } from './vehicle-journeys-view.service';
import { VehicleJourneyInfo, VehicleJourneyView, VehicleJourneyViewParams } from './vehicle-journey-view.model';
import { JourneyNavComponent } from './journey-nav/journey-nav.component';
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from '../vehicle-journeys-search/vehicle-journeys-search.service';

describe('VehicleJourneysViewComponent', () => {
  let spectator: SpectatorRouting<VehicleJourneysViewComponent>;
  let viewService: VehicleJourneysViewService;

  const journeyId = 'VJ7eb0894c0ed7613e55fc516103b05db9408cdd05';
  const startTime = '2022-08-18T11:22:00.000+01:00';
  const mockInfo = <VehicleJourneyInfo>{
    operatorInfo: {
      operatorId: '1',
      operatorName: 'Operator 1',
      nocCode: 'NO1',
    },
    serviceInfo: {
      serviceId: '5',
      serviceName: 'Bristol to Bath',
      serviceNumber: '5',
    },
    startTime: DateTime.fromISO(startTime, { zone: 'utc' }),
    vehicleId: 'ABC-123',
  };
  const mockView = new VehicleJourneyView();
  mockView.journeyInfo = mockInfo;
  mockView.stopList = [mockVehicleStopPingFactory(), mockVehicleStopPingFactory(), mockVehicleStopPingFactory()];
  const viewParams = <VehicleJourneyViewParams>{
    timingPointsOnly: true,
  };
  const mockPrevJourney = <VehicleJourney>{
    vehicleJourneyId: 'VJ564d30c786cf4cae8a2276393b3263dc',
    startTime: DateTime.fromISO('2022-08-18T11:07:00.000+01:00'),
    lineNumber: '5',
    servicePattern: 'Bristol to Bath',
  };
  const mockNextJourney = <VehicleJourney>{
    vehicleJourneyId: 'VJ849a1ba0f34c4d3fad757a7fee47636d',
    startTime: DateTime.fromISO('2022-08-18T11:37:00.000+01:00'),
    lineNumber: '5',
    servicePattern: 'Bristol to Bath',
  };

  const createComponent = createRoutingFactory({
    component: VehicleJourneysViewComponent,
    imports: [SharedModule, LayoutModule, ApolloTestingModule, RouterTestingModule, HttpClientTestingModule],
    declarations: [
      MockComponent(StopListComponent),
      MockComponent(JourneyInfoComponent),
      MockComponent(JourneyNavComponent),
    ],
    mocks: [VehicleJourneysSearchService],
    stubsEnabled: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    viewService = spectator.inject(VehicleJourneysViewService);
    spectator
      .inject(VehicleJourneysSearchService)
      .fetchNextPrevJourneys.and.returnValue(of([mockPrevJourney, mockNextJourney]));
  });

  it('should call getVehicleJourneyView with journeyId, startTime and viewParams', () => {
    const spy = spyOn(viewService, 'getVehicleJourneyView').and.returnValue(of(mockView));
    spectator.setRouteParam('journeyId', journeyId);
    spectator.setRouteQueryParam('startTime', toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(journeyId, DateTime.fromISO(startTime), viewParams);
  });

  it('should display error message when getVehicleJourneyView throws an error', () => {
    spyOn(viewService, 'getVehicleJourneyView').and.returnValue(throwError(() => new Error('Not found')));
    spectator.setRouteParam('journeyId', journeyId);
    spectator.setRouteQueryParam('startTime', toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(spectator.query(byTextContent('Not found', { selector: '.page-header__title' }))).toBeVisible();
    expect(
      spectator.query(
        byTextContent(
          'Vehicle journey not found, or you do not have permission to view. Go back to Vehicle journeys?',
          {
            selector: '.govuk-body',
          }
        )
      )
    ).toBeVisible();
  });

  it('should display the service number and name in page title', () => {
    spyOn(viewService, 'getVehicleJourneyView').and.returnValue(of(mockView));
    spectator.setRouteParam('journeyId', journeyId);
    spectator.setRouteQueryParam('startTime', toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(spectator.query(byTextContent('5: Bristol to Bath', { selector: '.page-header__title' }))).toBeVisible();
  });

  it('should set timingPointsOption to timing-points if queryParam is true', () => {
    spectator.setRouteParam('journeyId', journeyId);
    spectator.setRouteQueryParam('startTime', toUrlDateFormat(startTime));
    spectator.setRouteQueryParam('timingPointsOnly', 'true');
    spectator.detectChanges();

    expect(spectator.component.timingPointsOption).toEqual('timing-points');
  });
});
