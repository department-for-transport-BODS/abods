import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { FeatureIdentifier, Map } from 'mapbox-gl';
import { GpsFeedJourneyStatus } from '../../../../generated/graphql';
import { ConfigService } from '../../../config/config.service';
import { StopHoverEvent } from '../stop-list/stop-item/stop-item.component';
import { VehicleJourneyView, VehicleJourneyViewParams } from '../vehicle-journey-view.model';
import { ApolloGpsFeedType, StopDetails } from '../vehicle-journeys-view.service';
import { VehiclePing } from '../vehicle-ping.model';

import { JourneyMapComponent } from './journey-map.component';

describe('JourneyMapComponent', () => {
  let component: JourneyMapComponent;
  let fixture: ComponentFixture<JourneyMapComponent>;
  const t1 = '2022-08-18T11:20:00.000+01:00';
  const t2 = '2022-08-18T11:21:00.000+01:00';
  const startTime = '2022-08-18T11:20:00.000+01:00';
  const mockStops: StopDetails[] = [
    {
      stopId: 'ST43000158103',
      stopName: 'Solihull Town Centre',
      lon: -1.78000522,
      lat: 52.4139824,
      startTime: DateTime.fromISO(startTime),
      timingPoint: true,
    },
    {
      stopId: 'ST43000139402',
      stopName: 'Whitefields Rd',
      lon: -1.77750742,
      lat: 52.407795,
      startTime: DateTime.fromISO(startTime),
      timingPoint: false,
    },
    {
      stopId: 'ST43000139302',
      stopName: 'Solihull Sixth Form College',
      lon: -1.77633333,
      lat: 52.4044762,
      startTime: DateTime.fromISO(startTime),
      timingPoint: false,
    },
  ];
  const mockJourney: ApolloGpsFeedType[] = [
    {
      ts: t1,
      lat: 52.4139834,
      lon: -1.78000502,
      vehicleId: 'ABC-123',
      vehicleJourneyId: 'xyz987',
      servicePatternId: '456',
      delay: 120,
      startTime: startTime,
      scheduledDeparture: startTime,
      feedStatus: null,
      journeyStatus: GpsFeedJourneyStatus.Started,
      isTimingPoint: true,
      operatorInfo: {
        operatorId: 'op1',
        operatorName: 'Operator 1',
        nocCode: 'NOC1',
      },
      serviceInfo: {
        serviceId: 's5',
        serviceName: 'Solihull - Birmingham',
        serviceNumber: '5',
      },
      previousStopInfo: {
        stopId: 'ST43000158103',
        stopName: 'Solihull Town Centre',
      },
    },
    {
      ts: t2,
      lat: 52.4139838,
      lon: -1.78000505,
      vehicleId: 'ABC-123',
      vehicleJourneyId: 'xyz987',
      servicePatternId: '456',
      delay: 120,
      startTime: startTime,
      scheduledDeparture: startTime,
      feedStatus: null,
      journeyStatus: GpsFeedJourneyStatus.Started,
      isTimingPoint: false,
      operatorInfo: {
        operatorId: 'op1',
        operatorName: 'Operator 1',
        nocCode: 'NOC1',
      },
      serviceInfo: {
        serviceId: 's5',
        serviceName: 'Solihull - Birmingham',
        serviceNumber: '5',
      },
      previousStopInfo: {
        stopId: 'ST43000158103',
        stopName: 'Solihull Town Centre',
      },
    },
  ];
  const mockViewParams = <VehicleJourneyViewParams>{};
  const mockView = VehicleJourneyView.createView(mockStops, mockJourney, mockViewParams);
  const mapStub = <Map>{
    setFeatureState: (feature: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, state: { [key: string]: any }) => {
      feature;
      state;
    },
    removeFeatureState: (target: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, key?: string) => {
      target;
      key;
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JourneyMapComponent],
      providers: [
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JourneyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.map = mapStub;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });
    });

    describe('view updated', () => {
      it('should update stops', () => {
        expect(component.stops).toBeTruthy();
        expect(component.stops?.features.length).toEqual(2);
        expect(component.stops?.features[0].geometry.coordinates[0]).toEqual(mockStops[1]?.lon);
        expect(component.stops?.features[0].geometry.coordinates[1]).toEqual(mockStops[1]?.lat);
        expect(component.stops?.features[1].geometry.coordinates[0]).toEqual(mockStops[2]?.lon);
        expect(component.stops?.features[1].geometry.coordinates[1]).toEqual(mockStops[2]?.lat);
      });

      it('should update timingPoints', () => {
        expect(component.timingPoints).toBeTruthy();
        expect(component.timingPoints?.features.length).toEqual(1);
        expect(component.timingPoints?.features[0].geometry.coordinates[0]).toEqual(mockStops[0]?.lon);
        expect(component.timingPoints?.features[0].geometry.coordinates[1]).toEqual(mockStops[0]?.lat);
      });

      it('should update line', () => {
        expect(component.line).toBeTruthy();
        expect(component.line?.features[0].geometry.coordinates[0]).toEqual([mockJourney[0].lon, mockJourney[0].lat]);
        expect(component.line?.features[0].geometry.coordinates[1]).toEqual([mockJourney[1].lon, mockJourney[1].lat]);
      });

      it('should update pings', () => {
        expect(component.pings).toBeTruthy();
        expect(component.pings?.features[0].geometry.coordinates[0]).toEqual(mockJourney[0].lon);
        expect(component.pings?.features[0].geometry.coordinates[1]).toEqual(mockJourney[0].lat);
        expect(component.pings?.features[1].geometry.coordinates[0]).toEqual(mockJourney[1].lon);
        expect(component.pings?.features[1].geometry.coordinates[1]).toEqual(mockJourney[1].lat);
      });

      it('should update bounds', () => {
        const expectedBounds = [-1.78000522, 52.4044762, -1.77633333, 52.4139838];

        expect(component.bounds).toEqual(expectedBounds);
      });

      it('should reset move counter when loading', () => {
        component.moveCounter = 5;
        component.loading = true;
        component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });

        expect(component.moveCounter).toEqual(0);
      });
    });

    describe('selectedStop updated', () => {
      it('should update map bounds to timing point', () => {
        component.ngOnChanges({ selectedStop: new SimpleChange(null, mockView.stopList[0], true) });
        const expectedBounds = [-1.78000522, 52.4139824, -1.78000522, 52.4139824];

        expect(component.bounds).toEqual(expectedBounds);
      });

      it('should update map bounds to stop', () => {
        component.ngOnChanges({ selectedStop: new SimpleChange(null, mockView.stopList[1], true) });
        const expectedBounds = [-1.77750742, 52.407795, -1.77750742, 52.407795];

        expect(component.bounds).toEqual(expectedBounds);
      });
    });

    describe('hoveredStop updated', () => {
      const hoveredStop = <StopHoverEvent>{ stop: mockView.stopList[0], event: 'enter' };

      beforeEach(() => {
        hoveredStop.event = 'enter';
        component.ngOnChanges({ hoveredStop: new SimpleChange(null, hoveredStop, true) });
      });

      it('should set tooltipStop to hoveredStop on enter', () => {
        expect(component.tooltipStop).toEqual(mockView.stopList[0]);
      });

      it('should set tooltipStop to undefined on leave', () => {
        hoveredStop.event = 'leave';
        component.ngOnChanges({ hoveredStop: new SimpleChange(null, hoveredStop, true) });

        expect(component.tooltipStop).toBeUndefined();
      });
    });
  });

  describe('ping tooltip', () => {
    const hoveredPing = <VehiclePing>{ id: '001' };

    beforeEach(() => {
      component.onPingMouseEnter(hoveredPing);
    });

    it('should set tooltipPing to hoveredStop on enter', () => {
      expect(component.tooltipPing).toEqual(hoveredPing);
    });

    it('should set tooltipPing to undefined on leave', () => {
      component.onPingMouseLeave();

      expect(component.tooltipPing).toBeUndefined();
    });
  });

  describe('recentre', () => {
    beforeEach(() => {
      component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });
    });

    it('should reset move counter', () => {
      component.moveCounter = 6;
      component.recentre();

      expect(component.moveCounter).toEqual(0);
    });

    it('should set bounds', () => {
      const expectedBounds = [-1.78000522, 52.4044762, -1.77633333, 52.4139838];
      component.bounds = [1, 2, 3, 4];
      component.recentre();

      expect(component.bounds).toEqual(expectedBounds);
    });
  });
});
