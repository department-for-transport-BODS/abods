import { Component, Input } from '@angular/core';

@Component({
  selector: 'gds-radio-conditional',
  template: `
    <div class="govuk-radios__conditional" [ngClass]="{ 'govuk-radios__conditional--hidden': !visible }">
      <div class="govuk-form-group">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class RadioConditionalComponent {
  @Input() visible = false;
}
