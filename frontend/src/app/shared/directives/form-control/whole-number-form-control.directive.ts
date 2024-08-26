import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName][wholeNumber]',
})
export class WholeNumberFormControlDirective {
  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event.target'])
  public onInput(input: HTMLInputElement): void {
    if (input.value.match(/\./g)) {
      this.ngControl.control?.setValue(Math.floor(parseFloat(input.value)));
    }
  }
}
