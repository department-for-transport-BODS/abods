import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stop } from '../corridors.service';

import { SegmentSelectorComponent } from './segment-selector.component';

describe('SegmentSelectorComponent', () => {
  let component: SegmentSelectorComponent;
  let fixture: ComponentFixture<SegmentSelectorComponent>;

  const segment0 = <[Stop, Stop]>[
    {
      stopId: '0',
    },
    {
      stopId: '1',
    },
  ];

  const segment1 = <[Stop, Stop]>[
    {
      stopId: '1',
    },
    {
      stopId: '2',
    },
  ];

  const segment2 = <[Stop, Stop]>[
    {
      stopId: '2',
    },
    {
      stopId: '3',
    },
  ];

  const segment3 = <[Stop, Stop]>[
    {
      stopId: '3',
    },
    {
      stopId: '4',
    },
  ];

  const segment4 = <[Stop, Stop]>[
    {
      stopId: '4',
    },
    {
      stopId: '5',
    },
  ];

  const serviceLinks = [
    {
      fromStop: '0',
      toStop: '1',
      distance: 0,
      routeValidity: 'VALID',
    },
    {
      fromStop: '1',
      toStop: '2',
      distance: 10,
      routeValidity: 'VALID',
    },
    {
      fromStop: '2',
      toStop: '3',
      distance: 200,
      routeValidity: 'INVALID_NO_ROUTE_POINTS',
    },
    {
      fromStop: '3',
      toStop: '4',
      distance: 300,
      routeValidity: 'VALID',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SegmentSelectorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should pair up stops into segments', () => {
      component.stops = [
        <Stop>{ stopId: '1' },
        <Stop>{ stopId: '2' },
        <Stop>{ stopId: '3' },
        <Stop>{ stopId: '4' },
        <Stop>{ stopId: '5' },
      ];
      component.ngOnChanges();

      expect(component.segments).toEqual([segment1, segment2, segment3, segment4]);
    });

    it('should set segments to empty array if stops is undefined', () => {
      component.stops = undefined;
      component.ngOnChanges();

      expect(component.segments).toEqual([]);
    });
  });

  describe('onSelect', () => {
    it('should set segement as selected', () => {
      component.onSelect(segment1);

      expect(component.selected).toEqual(segment1);
    });

    it('should emit selected segment', () => {
      spyOn(component.selectSegment, 'emit');
      component.onSelect(segment1);

      expect(component.selectSegment.emit).toHaveBeenCalledWith(segment1);
    });

    it('should call next on deselected segment', () => {
      component.onSelect(segment1);
      spyOn(component.deselectSegment, 'next');
      component.onSelect(segment2);

      expect(component.deselectSegment.next).toHaveBeenCalledWith(segment1);
      expect(component.selected).toEqual(segment2);
    });

    it('should emit empty array if no segment passed', () => {
      spyOn(component.selectSegment, 'emit');
      component.onSelect();

      expect(component.selectSegment.emit).toHaveBeenCalledWith([]);
      expect(component.selected).toEqual(undefined);
    });
  });

  describe('isSelected', () => {
    it('should return true if both stopIds match', () => {
      component.selected = segment1;

      expect(component.isSelected(segment1)).toBeTrue();
    });

    it('should return false if only one stopId match', () => {
      component.selected = segment2;

      expect(component.isSelected(segment1)).toBeFalse();
    });

    it('should return false if neither stopIds match', () => {
      component.selected = segment3;

      expect(component.isSelected(segment1)).toBeFalse();
    });

    it('should return false if selected is undefined', () => {
      component.selected = undefined;

      expect(component.isSelected(segment1)).toBeFalse();
    });
  });

  describe('getSegmentDistance', () => {
    it('should return undefined if serviceLinks is undefined', () => {
      component.serviceLinks = undefined;

      expect(component.getSegmentDistance(segment1)).toBeUndefined();
    });

    it('should return distance in meters', () => {
      component.serviceLinks = serviceLinks;

      expect(component.getSegmentDistance(segment0)).toEqual(0);
      expect(component.getSegmentDistance(segment1)).toEqual(10);
      expect(component.getSegmentDistance(segment2)).toEqual(200);
      expect(component.getSegmentDistance(segment3)).toEqual(300);
    });

    it('should return undefined if serviceLinks is empty array', () => {
      component.serviceLinks = [];

      expect(component.getSegmentDistance(segment1)).toBeUndefined();
    });
  });

  describe('isInvalidServiceLink', () => {
    it('should return false if serviceLinks is undefined', () => {
      component.serviceLinks = undefined;

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
    });

    it('should return false if serviceLinks is empty array', () => {
      component.serviceLinks = [];

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
    });

    it('should return false if segment is VALID', () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
      expect(component.isInvalidServiceLink(segment3)).toBeFalse();
    });

    it('should return true if segment is INVALID', () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment2)).toBeTrue();
    });

    it('should return false if segment not in serviceLinks array', () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment4)).toBeFalse();
    });
  });

  describe('containsInvalidServiceLink', () => {
    it('should return false if serviceLinks is undefined and segments set', () => {
      component.serviceLinks = undefined;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    it('should return false if serviceLinks is empty array and segments set', () => {
      component.serviceLinks = [];
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    it('should return true if serviceLinks contains INVALID segment', () => {
      component.serviceLinks = serviceLinks;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeTrue();
    });

    it('should return false if all serviceLinks are VALID', () => {
      serviceLinks[2].routeValidity = 'VALID';
      component.serviceLinks = serviceLinks;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    afterEach(() => {
      serviceLinks[2].routeValidity = 'INVALID_NO_ROUTE_POINTS';
    });
  });
});
