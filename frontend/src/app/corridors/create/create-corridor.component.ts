import { Component, OnDestroy, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import {
  catchError,
  debounceTime,
  filter,
  finalize,
  share,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { asGeoJsonPoints, Corridor, CorridorsService, Stop } from '../corridors.service';
import { featureCollection, lineString } from '@turf/helpers';
import bbox from '@turf/bbox';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { BRITISH_ISLES_BBOX, position } from '../../shared/geo';
import { combineLatest, EMPTY, ReplaySubject, Subject } from 'rxjs';
import { FitBoundsOptions, LngLatBounds } from 'mapbox-gl';
import { ActivatedRoute, Router } from '@angular/router';
import { FormErrors, genericErrorMessage } from '../../shared/gds/error-summary/error-summary.component';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { GeocodingService } from '../../shared/mapbox/geocoding.service';
import { GeocodingFeature, GeocodingResult } from '../../shared/mapbox/geocoding.types';
import { combine } from '../../shared/rxjs-operators';
import { CorridorMapComponent } from './corridor-map/corridor-map.component';
import { CorridorNotFoundView } from '../corridor-not-found-view.model';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { TextInputComponent } from '../../shared/gds/text-input/text-input.component';
import { Location } from '@angular/common';

export const FIT_BOUNDS_OPTIONS = { padding: 50, maxZoom: 16, duration: 0 };

// Don't allow searching by location for too large an area
const validLocationSearchBounds = (bounds?: LngLatBounds) =>
  bounds ? bounds.getEast() - bounds.getWest() < 0.9 : true; // Angular separation in degrees

@Component({
  templateUrl: 'create-corridor.component.html',
  styleUrls: ['./create-corridor.component.scss'],
})
export class CreateCorridorComponent implements OnInit, OnDestroy {
  corridorForm = this.formBuilder.group({
    name: ['', [CustomValidators.requiredNoWhitespace, Validators.maxLength(256)]],
    searchMode: 'location',
    stopQuery: ['', [Validators.minLength(4)]],
  });

  isEdit = false;
  errorView?: CorridorNotFoundView;
  corridor?: Corridor;

  stopList$ = new Subject<Stop[]>();
  stopList: Stop[] = [];
  matchingStops?: FeatureCollection<Point, Stop>;
  matchingStopLines?: FeatureCollection<LineString>;
  corridorStops?: FeatureCollection<Point, Stop>;
  corridorLine?: Feature<LineString>;
  otherStops?: FeatureCollection<Point, Stop>;
  nonOrgStops?: FeatureCollection<Point, Stop>;

  loading = false;
  noData = false;
  submitted = false;
  creating = false;
  updating = false;
  createError: FormErrors[] = [];
  destroy$ = new Subject<void>();

  boundsChange$ = new ReplaySubject<LngLatBounds>(1);
  locationSearch$ = new Subject<string>();
  locationsLoading = false;
  currentBounds?: BBox2d | GeocodingFeature;
  locations?: GeocodingResult;

  hasSelectedLocation = false;
  resetMoveCounter: EventEmitter<void> = new EventEmitter();

  private readonly canGoBack: boolean;

  @ViewChild(CorridorMapComponent) corridorMap!: CorridorMapComponent;
  @ViewChild('corridorName') nameInput!: TextInputComponent;

  constructor(
    private formBuilder: FormBuilder,
    private corridorsService: CorridorsService,
    private router: Router,
    private geocodingService: GeocodingService,
    private route: ActivatedRoute,
    private modalService: NgxSmartModalService,
    private location: Location
  ) {
    this.canGoBack = !!this.router.getCurrentNavigation()?.previousNavigation;
  }

  get name(): FormControl {
    return this.corridorForm.get('name') as FormControl;
  }

  get searchMode(): FormControl {
    return this.corridorForm.get('searchMode') as FormControl;
  }

  get stopQuery(): FormControl {
    return this.corridorForm.get('stopQuery') as FormControl;
  }

  get zoomedTooFarOut(): boolean {
    return this.searchMode.value === 'location' && !validLocationSearchBounds(this.corridorMap.map?.getBounds());
  }

  ngOnInit() {
    const stopSearch$ = this.stopQuery.valueChanges.pipe(
      filter((query) => query?.length > 3),
      debounceTime(400)
    );

    const resetLocationSearch$ = combineLatest([
      this.stopList$.pipe(startWith(<Stop[]>[])),
      this.searchMode.valueChanges.pipe(startWith('location')),
    ]).pipe(share());

    // Only search by location when adding a first stop and location mode is selected
    const locationSearch$ = resetLocationSearch$.pipe(
      filter(([stopList, searchMode]) => stopList.length === 0 && searchMode === 'location'),
      switchMap(() => this.boundsChange$.pipe(filter(validLocationSearchBounds), takeUntil(resetLocationSearch$)))
    );

    // Only search for subsequent stops after a first stop has been selected
    const subsequentStopSearch$ = this.stopList$.pipe(filter((stopList) => stopList.length > 0));

    this.searchMode.valueChanges.subscribe(() => {
      this.stopQuery.reset();
      this.matchingStops = undefined;
      this.locations = undefined;
      this.hasSelectedLocation = false;
      this.setMapBounds(BRITISH_ISLES_BBOX, { maxDuration: 1 });
      this.corridorMap.nonOrgStops = undefined;
      this.corridorMap.otherStops = undefined;
      this.noData = false;
    });

    // Search for first stop
    combine([stopSearch$, locationSearch$])
      .pipe(
        tap(() => {
          this.loading = true;
          this.noData = false;
          this.matchingStops = undefined;
          this.corridorMap.nonOrgStops = undefined;
          this.corridorMap.mapClearHover();
        }),
        switchMap(([query, bounds]) =>
          this.corridorsService.queryStops(query, bounds).pipe(
            catchError(() => {
              this.noData = true;
              return EMPTY;
            }),
            finalize(() => (this.loading = false))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((stops) => {
        this.noData = stops.orgStops.length === 0;
        this.matchingStops = asGeoJsonPoints(stops.orgStops);
        this.corridorMap.nonOrgStops = asGeoJsonPoints(stops.nonOrgStops);

        if (this.searchMode.value === 'stop' && !this.noData) {
          this.setMapBounds(bbox(this.matchingStops) as BBox2d, FIT_BOUNDS_OPTIONS);
        }
      });

    // Search for subsequent stops
    subsequentStopSearch$
      .pipe(
        tap(() => {
          this.loading = true;
          this.matchingStops = undefined;
          this.nonOrgStops = undefined;
          this.corridorMap?.mapClearHover();
        }),
        switchMap((stopList) =>
          this.corridorsService
            .fetchSubsequentStops(stopList.map((stop) => stop.stopId))
            .pipe(finalize(() => (this.loading = false)))
        )
      )
      .subscribe((stops) => {
        this.noData = stops.length === 0;

        const [lastStop] = this.stopList.slice(-1);

        this.matchingStops = asGeoJsonPoints(stops);
        this.matchingStopLines = featureCollection(
          stops.map((stop) => lineString([position(lastStop), position(stop)], stop, { id: stop.intId }))
        );

        if (this.corridorMap.map) {
          const allStops = featureCollection([...(this.corridorStops?.features ?? []), ...this.matchingStops.features]);
          this.setMapBounds(bbox(allStops) as BBox2d, { ...FIT_BOUNDS_OPTIONS, duration: 500 });
        }
      });

    // Search for other stops to show as blue dots, as a visual aid
    subsequentStopSearch$
      .pipe(
        switchMap(() =>
          this.boundsChange$.pipe(
            filter(validLocationSearchBounds),
            takeUntil(resetLocationSearch$),
            finalize(() => {
              this.otherStops = undefined;
              this.nonOrgStops = undefined;
            })
          )
        ),
        switchMap((bounds) => this.corridorsService.queryStops(undefined, bounds).pipe(catchError(() => EMPTY))),
        takeUntil(this.destroy$)
      )
      .subscribe((otherStops) => {
        this.otherStops = asGeoJsonPoints(otherStops.orgStops);
        this.nonOrgStops = asGeoJsonPoints(otherStops.nonOrgStops);
      });

    // TODO factor out separate child components for the two search modes
    this.locationSearch$
      .pipe(
        filter((str) => !!str),
        debounceTime(200),
        tap(() => (this.locationsLoading = true)),
        switchMap((searchText) =>
          this.geocodingService
            .forward(searchText, {
              excludeTypes: ['poi', 'region', 'country'],
              proximity: this.corridorMap.map?.getCenter(), // TODO make this conditional?
            })
            .pipe(finalize(() => (this.locationsLoading = false)))
        )
      )
      .subscribe((locations) => (this.locations = locations));

    // Init edit mode after subscriptions have been initialised above
    const view: CorridorNotFoundView | Corridor = this.route.snapshot.data['corridor'];
    if (view) {
      this.initEditMode(view);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopList$.complete();
  }

  private initEditMode(view: CorridorNotFoundView | Corridor) {
    // Check type for corridor not found view
    if (view instanceof CorridorNotFoundView) {
      this.errorView = view;
    } else {
      // User can edit corridor
      this.corridor = view;
      this.isEdit = true;
      this.name.patchValue(view.name);
      this.setStopList(view.stops);
    }
  }

  setStopList(stops: Stop[]) {
    this.stopList = stops;
    this.corridorStops = stops.length ? asGeoJsonPoints(stops) : undefined;
    this.corridorLine = stops.length > 1 ? lineString(stops.map(position)) : undefined;

    this.matchingStops = undefined;
    this.matchingStopLines = undefined;
    this.corridorMap?.mapClearHover();

    this.stopList$.next(stops);
  }

  addStop(nextStop?: Feature<Point, Stop>) {
    if (this.loading || !nextStop) return;
    this.setStopList([...this.stopList, nextStop.properties]);
  }

  removeLastStop() {
    if (this.loading) return;
    this.setStopList(this.stopList.slice(0, -1));
    if (this.stopList.length === 0 && this.searchMode.value === 'stop') {
      // Trigger stop search
      this.stopQuery.updateValueAndValidity();
    }
  }

  createCorridor() {
    if (this.loading) return;

    this.submitted = true;
    if (this.name.invalid || this.creating) {
      this.nameInput.focus();
      return;
    }

    this.creating = true;
    this.corridorsService
      .createCorridor(
        this.name.value,
        this.stopList.map((stop) => stop.stopId)
      )
      .subscribe({
        next: () => this.router.navigate(['/corridors']),
        error: (error) => {
          console.error(error);
          this.creating = false;
          this.createError = genericErrorMessage(
            `We're having trouble creating your corridor. Please try again later.`
          );
        },
      });
  }

  updateCorridor() {
    if (!this.corridor) return;

    this.submitted = true;
    if (this.name.invalid || this.updating) {
      this.nameInput.focus();
      return;
    }

    this.updating = true;
    this.corridorsService
      .updateCorridor({
        name: this.name.value,
        id: this.corridor.id,
        stopList: this.stopList.map((stop) => stop.stopId),
      })
      .subscribe({
        next: () => this.navigateToPreviousView(),
        error: (error) => {
          console.error(error);
          this.updating = false;
          this.createError = genericErrorMessage(
            `We're having trouble updating your corridor. Please try again later.`
          );
        },
      });
  }

  selectLocation(location?: GeocodingFeature) {
    this.hasSelectedLocation ||= !!location;
    if (location?.bbox) {
      this.setMapBounds(location.bbox, FIT_BOUNDS_OPTIONS);
    } else if (location?.center) {
      this.setMapBounds(location);
    }
  }

  confirmDeleteCorridor() {
    this.modalService.open('deleteCorridor');
  }

  deleteCorridor() {
    if (!this.corridor) {
      return;
    }
    this.corridorsService
      .deleteCorridor(this.corridor?.id)
      .pipe(finalize(() => this.modalService.close('deleteCorridor')))
      .subscribe({
        next: () => this.router.navigate(['/corridors']),
        error: () =>
          (this.createError = genericErrorMessage(
            `We're having trouble deleting your corridor. Please try again later.`
          )),
      });
  }

  setMapBounds(value: BBox2d | GeocodingFeature, options?: FitBoundsOptions) {
    if (!value) {
      return;
    }
    this.currentBounds = value;
    this.resetMoveCounter.emit();
    if (value instanceof Array) {
      this.corridorMap.map?.fitBounds(value as BBox2d, options);
    } else if (value instanceof Object) {
      this.corridorMap.map?.flyTo({ ...value, duration: 0, zoom: 15 });
    }
  }

  centreMapBounds() {
    return this.currentBounds ? this.setMapBounds(this.currentBounds, FIT_BOUNDS_OPTIONS) : null;
  }

  navigateToPreviousView() {
    return this.canGoBack ? this.location.back() : this.router.navigate(['/corridors']);
  }

  displayRecentreButton(): boolean {
    if (this.loading) {
      return false;
    } else if (this.searchMode.value === 'location' && !this.hasSelectedLocation && !this.isEdit) {
      return false;
    } else if (this.searchMode.value === 'stop' && !this.matchingStops) {
      return false;
    } else {
      return true;
    }
  }
}
