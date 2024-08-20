import { Component, Input } from '@angular/core';

@Component({
  selector: 'gds-fieldset',
  template: `
    <fieldset class="govuk-fieldset">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
        <h1 class="govuk-fieldset__heading">
          {{ legend }}
        </h1>
      </legend>
      <ng-content></ng-content>
    </fieldset>
  `,
  styles: [],
})
export class FieldsetComponent {
  @Input() legend?: string;
}
