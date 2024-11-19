import { Component, EventEmitter, Input, Output } from "@angular/core";
import { isNotNullOrUndefined } from "../../../shared/rxjs-operators";
import { StopHoverEvent } from "./stop-item/stop-item.component";
import { StopDetails } from "../vehicle-journeys-view.component";

@Component({
  selector: "app-stop-list",
  templateUrl: "./stop-list.component.html",
  styleUrls: ["./stop-list.component.scss"],
})
export class StopListComponent {
  @Input() stopList?: StopDetails[];
  @Input() timingPointsOnly = false;
  @Input() loading?: boolean;
  @Output() stopSelected = new EventEmitter<StopDetails>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get isStopList(): boolean {
    return isNotNullOrUndefined(this.stopList) && this.stopList.length > 0;
  }
}
