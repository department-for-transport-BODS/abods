import { Component, EventEmitter, Input, Output } from "@angular/core";
import { StopHoverEvent } from "./stop-item/stop-item.component";
import { Stop } from "../../../../generated/graphql";
import { JourneyInfo } from "../vehicle-journeys-view.component";

@Component({
  selector: "app-stop-list",
  templateUrl: "./stop-list.component.html",
  styleUrls: ["./stop-list.component.scss"],
})
export class StopListComponent {
  @Input() view: JourneyInfo | null = null;
  @Input() timingPointsOnly = false;
  @Input() loading?: boolean;
  @Input() estimated = false;
  @Output() stopSelected = new EventEmitter<Stop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get isStopList(): boolean {
    return (this.view?.stops.length ?? 0) > 0;
  }
}
