import { Directive, HostBinding, Input } from '@angular/core';
import { GDSSpacingSizes } from 'src/app/shared/types';
import { join, keys, pickBy } from 'lodash-es';

export const asClassString = (classDict: Record<string, unknown>) => join(keys(pickBy(classDict)), ' ');

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[gdsButton]',
})
export class ButtonDirective {
  @Input() @HostBinding('attr.aria-disabled') disabled = false;
  @Input() appearance?: 'secondary' | 'warning';
  @Input() spaceBelow?: GDSSpacingSizes;
  @Input() spaceAbove?: GDSSpacingSizes;

  @HostBinding('data-module')
  module = 'govuk-button';

  @HostBinding('class')
  get buttonClasses() {
    return asClassString({
      'govuk-button': true,
      [`govuk-button--${this.appearance}`]: this.appearance,
      'govuk-button--disabled': this.disabled,
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    });
  }
}
