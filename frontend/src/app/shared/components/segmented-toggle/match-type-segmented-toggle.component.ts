import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatchType } from "../../../../generated/graphql";

@Component({
  selector: "app-match-type-segmented-toggle",
  template: `<app-segmented-toggle
    legend="Show performance using data from"
    [(ngModel)]="matchType"
    (ngModelChange)="emitChange()"
  >
    <app-segmented-toggle-item
      name="match-type"
      identifier="estimated"
      value="estimated"
      label="Estimated"
    />
    <app-segmented-toggle-item
      name="match-type"
      identifier="evidenced"
      value="evidenced"
      label="Evidenced"
    />
  </app-segmented-toggle>`,
  standalone: false,
})
export class MatchTypeSegmentedToggleComponent {
  @Input() matchType: MatchType = MatchType.Evidenced;
  @Output() toggleChange = new EventEmitter<MatchType>();

  emitChange() {
    this.toggleChange.emit(this.matchType);
  }
}
