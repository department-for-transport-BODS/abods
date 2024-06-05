import { Component, Input } from '@angular/core';
import { GDSSpacingSizes } from 'src/app/shared/types';
@Component({
  selector: 'app-box',
  template: '<div [ngClass]="boxClasses" [style.minHeight]="minHeight"><ng-content></ng-content></div>',
  styleUrls: ['./box.component.scss'],
})
export class BoxComponent {
  @Input() minHeight?: string;
  @Input() padding?: GDSSpacingSizes | [GDSSpacingSizes, GDSSpacingSizes, GDSSpacingSizes, GDSSpacingSizes];
  @Input() spaceAbove?: GDSSpacingSizes;
  @Input() spaceBelow?: GDSSpacingSizes;

  paddingClasses() {
    if (this.padding) {
      if (Array.isArray(this.padding)) {
        return {
          [`govuk-!-padding-top-${this.padding[0]}`]: true,
          [`govuk-!-padding-right-${this.padding[1]}`]: true,
          [`govuk-!-padding-bottom-${this.padding[2]}`]: true,
          [`govuk-!-padding-left-${this.padding[3]}`]: true,
        };
      } else return { [`govuk-!-padding-${this.padding}`]: true };
    }
  }

  get boxClasses() {
    return {
      box: true,
      ...this.paddingClasses(),
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    };
  }
}
