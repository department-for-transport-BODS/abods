import { Component, Input } from "@angular/core";

@Component({
  selector: "gds-panel",
  template: `
    <div class="govuk-panel govuk-panel--confirmation">
      <h1 *ngIf="title" class="govuk-panel__title">
        {{ title }}
      </h1>
      <div *ngIf="body" class="govuk-panel__body">
        {{ body }}
      </div>
    </div>
  `,
  styles: [],
  standalone: false,
})
export class PanelComponent {
  @Input() title?: string;
  @Input() body?: string;
}
