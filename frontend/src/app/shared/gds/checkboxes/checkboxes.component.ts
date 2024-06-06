import { Component, Input } from '@angular/core';
@Component({
  selector: 'gds-checkboxes',
  template: `
    <div class="govuk-form-group" [ngClass]="formGroupClasses">
      <fieldset class="govuk-fieldset">
        <legend *ngIf="legend" class="govuk-fieldset__legend" [ngClass]="legendClasses">
          {{ legend }}
        </legend>
        <span *ngIf="error" class="govuk-error-message">
          <span class="govuk-visually-hidden">Error:</span> {{ error }}
        </span>
        <div class="govuk-checkboxes" [ngClass]="checkboxesClasses">
          <ng-content></ng-content>
        </div>
      </fieldset>
    </div>
  `,
  styleUrls: ['checkboxes.component.scss'],
})
export class CheckboxesComponent {
  @Input() size?: 'small';
  @Input() layout?: 'horizontal' | '2-column';
  @Input() legend?: string;
  @Input() legendSize?: 's' | 'm' | 'l';
  @Input() error?: string;

  get checkboxesClasses() {
    return {
      [`govuk-checkboxes--${this.size}`]: this.size,
      [`checkboxes--${this.layout}`]: this.layout,
      checkboxes: true,
    };
  }

  get legendClasses() {
    return {
      [`govuk-fieldset__legend--${this.legendSize}`]: this.legendSize,
    };
  }

  get formGroupClasses() {
    return {
      ['govuk-form-group--error']: !!this.error,
    };
  }
}
