import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName][maxNumber]',
})
export class MaxNumberFormControlDirective {
  @Input() maxNumber!: number;

  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event.target'])
  public onInput(input: HTMLInputElement): void {
    if (parseInt(input.value) > this.maxNumber) {
      this.ngControl.control?.setValue(this.maxNumber);
    }
  }
}
