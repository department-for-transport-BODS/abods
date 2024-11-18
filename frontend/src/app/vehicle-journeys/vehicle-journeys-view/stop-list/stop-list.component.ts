import { Component, EventEmitter, Input, Output } from "@angular/core";
import { isNotNullOrUndefined } from "../../../shared/rxjs-operators";
import { StopHoverEvent } from "./stop-item/stop-item.component";
import { Stop } from "../../../../generated/graphql";

@Component({
  selector: "app-stop-list",
  templateUrl: "./stop-list.component.html",
  styleUrls: ["./stop-list.component.scss"],
})
export class StopListComponent {
  @Input() stopList?: Stop[];
  @Input() timingPointsOnly = false;
  @Input() estimated = false;
  @Input() loading?: boolean;
  @Output() stopSelected = new EventEmitter<Stop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get isStopList(): boolean {
    return isNotNullOrUndefined(this.stopList) && this.stopList.length > 0;
  }
}
