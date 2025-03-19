import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Subject } from "rxjs";
import {
  GeocodingFeature,
  GeocodingResult,
} from "../../mapbox/geocoding.types";
import { debounceTime, filter, finalize, switchMap, tap } from "rxjs/operators";
import { GeocodingService } from "../../mapbox/geocoding.service";
import { LngLat } from "mapbox-gl";

@Component({
  selector: "app-location-search",
  templateUrl: "./location-search.component.html",
  styleUrls: ["./location-search.component.scss"],
})
export class LocationSearchComponent implements OnInit {
  locationSearch$ = new Subject<string>();
  locationsLoading = false;
  locations?: GeocodingResult;
  @Input() searchCenter?: LngLat;
  @Input() fieldId = "";
  @Output() locationSelected = new EventEmitter<GeocodingFeature>();
  constructor(private geocodingService: GeocodingService) {}

  ngOnInit() {
    // TODO factor out separate child components for the two search modes
    this.locationSearch$
      .pipe(
        filter((str) => !!str),
        debounceTime(200),
        tap(() => (this.locationsLoading = true)),
        switchMap((searchText) =>
          this.geocodingService
            .forward(searchText, {
              excludeTypes: ["poi", "region", "country"],
              proximity: this.searchCenter, // TODO make this conditional?
            })
            .pipe(finalize(() => (this.locationsLoading = false))),
        ),
      )
      .subscribe((locations) => (this.locations = locations));
  }

  onLocationSelected($event: GeocodingFeature) {
    this.locationSelected.emit($event);
  }
}
