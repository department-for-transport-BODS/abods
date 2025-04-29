import { Component, EventEmitter, Input, Output } from "@angular/core";
import { StopTypeOption } from "../../../../generated/graphql";

@Component({
  selector: "app-stop-type-segmented-toggle",
  template: `<app-segmented-toggle
    legend="Show performance using data from"
    [(ngModel)]="stopType"
    (ngModelChange)="emitChange()"
  >
    <app-segmented-toggle-item
      name="stop-type"
      identifier="all-stops"
      value="all_stops"
      label="All stops"
    />
    <app-segmented-toggle-item
      name="stop-type"
      identifier="timing-points"
      value="timing_points"
      label="Timing points"
    />
  </app-segmented-toggle>`,
})
export class StopTypeSegmentedToggleComponent {
  @Input() stopType: StopTypeOption = StopTypeOption.TimingPoints;
  @Output() toggleChange = new EventEmitter<StopTypeOption>();

  emitChange() {
    this.toggleChange.emit(this.stopType);
  }
}
