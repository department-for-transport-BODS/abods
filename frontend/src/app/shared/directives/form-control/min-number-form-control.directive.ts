import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName][minNumber]',
})
export class MinNumberFormControlDirective {
  @Input() minNumber!: number;

  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event.target'])
  public onInput(input: HTMLInputElement): void {
    if (parseInt(input.value) < this.minNumber) {
      this.ngControl.control?.setValue(this.minNumber);
    }
  }
}
