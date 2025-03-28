import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Corridor } from "../types";

@Component({
  selector: "app-delete-corridor-modal",
  templateUrl: "./delete-corridor-modal.component.html",
  standalone: false,
})
export class DeleteCorridorModalComponent {
  @Input() corridor?: Corridor;
  @Output() deleteCorridor = new EventEmitter<Corridor>();
}
