import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Feature, FeatureCollection, Point } from "geojson";
import { isNotNullOrUndefined } from "../../../shared/rxjs-operators";
import { CorridorStop } from "../../corridors.service";

export const LIST_LEN = 100;

@Component({
  selector: "app-stop-search-list",
  templateUrl: "./stop-search-list.component.html",
  styleUrls: [
    "../corridor-stop-list/corridor-stop-list.component.scss",
    "./stop-search-list.component.scss",
  ],
})
export class StopSearchListComponent {
  @Input() matchingStops?: FeatureCollection<Point, CorridorStop>;
  @Input() isFirstStop = true;
  @Output() mouseOver: EventEmitter<Feature<Point, CorridorStop>> =
    new EventEmitter<Feature<Point, CorridorStop>>();
  @Output() mouseLeave: EventEmitter<Feature<Point, CorridorStop>> =
    new EventEmitter<Feature<Point, CorridorStop>>();
  @Output() addStop: EventEmitter<Feature<Point, CorridorStop>> =
    new EventEmitter<Feature<Point, CorridorStop>>();

  listSize = LIST_LEN;

  get stops(): Feature<Point, CorridorStop>[] | undefined {
    return this.matchingStops?.features.slice(0, this.listSize);
  }

  get showMoreBtn(): boolean {
    return (
      isNotNullOrUndefined(this.stops) &&
      (this.matchingStops?.features?.length ?? 0) > this.listSize
    );
  }

  showMore() {
    this.listSize += LIST_LEN;
  }
}
