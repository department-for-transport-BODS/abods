import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouteType, ServiceLinkType } from "../../../generated/graphql";
import { CorridorStop } from "../types";
import { SegmentSelectorComponent } from "./segment-selector.component";

fdescribe("SegmentSelectorComponent", () => {
  let component: SegmentSelectorComponent;
  let fixture: ComponentFixture<SegmentSelectorComponent>;

  const stop = (id: string): CorridorStop =>
    ({
      stopId: id,
      stopName: `Stop ${id}`,
      lon: 0,
      lat: 0,
      localityName: `Locality ${id}`,
      adminAreaId: `AdminArea${id}`,
      sourceId: `Source${id}`,
      naptan: id,
    }) as CorridorStop;

  const segment0: [CorridorStop, CorridorStop] = [stop("0"), stop("1")];
  const segment1: [CorridorStop, CorridorStop] = [stop("1"), stop("2")];
  const segment2: [CorridorStop, CorridorStop] = [stop("2"), stop("3")];
  const segment3: [CorridorStop, CorridorStop] = [stop("3"), stop("4")];
  const segment4: [CorridorStop, CorridorStop] = [stop("4"), stop("5")];

  let serviceLinks: ServiceLinkType[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SegmentSelectorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    serviceLinks = [
      {
        fromStop: "0",
        toStop: "1",
        distance: 0,
        routeValidity: RouteType.Valid,
      },
      {
        fromStop: "1",
        toStop: "2",
        distance: 10,
        routeValidity: RouteType.Valid,
      },
      {
        fromStop: "2",
        toStop: "3",
        distance: 200,
        routeValidity: RouteType.InvalidNoRoutePoints,
      },
      {
        fromStop: "3",
        toStop: "4",
        distance: 300,
        routeValidity: RouteType.Valid,
      },
    ];
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  describe("ngOnChanges", () => {
    it("should pair up stops into segments", async () => {
      component.stops = [stop("1"), stop("2"), stop("3"), stop("4"), stop("5")];
      component.ngOnChanges();

      await expect(component.segments).toEqual([
        segment1,
        segment2,
        segment3,
        segment4,
      ]);
    });

    it("should set segments to empty array if stops is undefined", async () => {
      component.stops = undefined;
      component.ngOnChanges();

      await expect(component.segments).toEqual([]);
    });
  });

  describe("onSelect", () => {
    it("should set segment as selected", async () => {
      component.onSelect(segment1);

      await expect(component.selected).toEqual(segment1);
    });

    it("should emit selected segment", () => {
      spyOn(component.selectSegment, "emit");
      component.onSelect(segment1);

      expect(component.selectSegment.emit).toHaveBeenCalledWith(segment1);
    });

    it("should call next on deselected segment", async () => {
      component.onSelect(segment1);
      spyOn(component.deselectSegment, "next");
      component.onSelect(segment2);

      expect(component.deselectSegment.next).toHaveBeenCalledWith(segment1);
      await expect(component.selected).toEqual(segment2);
    });

    it("should emit empty array if no segment passed", async () => {
      spyOn(component.selectSegment, "emit");
      component.onSelect();

      expect(component.selectSegment.emit).toHaveBeenCalledWith([]);
      await expect(component.selected).toEqual(undefined);
    });
  });

  describe("isSelected", () => {
    it("should return true if both stopIds match", () => {
      component.selected = segment1;

      expect(component.isSelected(segment1)).toBeTrue();
    });

    it("should return false if only one stopId match", () => {
      component.selected = segment2;

      expect(component.isSelected(segment1)).toBeFalse();
    });

    it("should return false if neither stopIds match", () => {
      component.selected = segment3;

      expect(component.isSelected(segment1)).toBeFalse();
    });

    it("should return false if selected is undefined", () => {
      component.selected = undefined;

      expect(component.isSelected(segment1)).toBeFalse();
    });
  });

  describe("getSegmentDistance", () => {
    it("should return undefined if serviceLinks is undefined", async () => {
      component.serviceLinks = undefined;

      await expect(component.getSegmentDistance(segment1)).toBeUndefined();
    });

    it("should return distance in meters", async () => {
      component.serviceLinks = serviceLinks;

      await expect(component.getSegmentDistance(segment0)).toEqual(0);
      await expect(component.getSegmentDistance(segment1)).toEqual(10);
      await expect(component.getSegmentDistance(segment2)).toEqual(200);
      await expect(component.getSegmentDistance(segment3)).toEqual(300);
    });

    it("should return undefined if serviceLinks is empty array", async () => {
      component.serviceLinks = [];

      await expect(component.getSegmentDistance(segment1)).toBeUndefined();
    });
  });

  describe("isInvalidServiceLink", () => {
    it("should return false if serviceLinks is undefined", () => {
      component.serviceLinks = undefined;

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
    });

    it("should return false if serviceLinks is empty array", () => {
      component.serviceLinks = [];

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
    });

    it("should return false if segment is VALID", () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment1)).toBeFalse();
      expect(component.isInvalidServiceLink(segment3)).toBeFalse();
    });

    it("should return true if segment is INVALID", () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment2)).toBeTrue();
    });

    it("should return false if segment not in serviceLinks array", () => {
      component.serviceLinks = serviceLinks;

      expect(component.isInvalidServiceLink(segment4)).toBeFalse();
    });
  });

  describe("containsInvalidServiceLink", () => {
    it("should return false if serviceLinks is undefined and segments set", () => {
      component.serviceLinks = undefined;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    it("should return false if serviceLinks is empty array and segments set", () => {
      component.serviceLinks = [];
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    it("should return true if serviceLinks contains INVALID segment", () => {
      component.serviceLinks = serviceLinks;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeTrue();
    });

    it("should return false if all serviceLinks are VALID", () => {
      serviceLinks[2].routeValidity = RouteType.Valid;
      component.serviceLinks = serviceLinks;
      component.segments = [segment1, segment2, segment3];

      expect(component.containsInvalidServiceLink()).toBeFalse();
    });

    afterEach(() => {
      serviceLinks[2].routeValidity = RouteType.InvalidNoRoutePoints;
    });
  });
});
