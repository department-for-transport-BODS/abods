import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName][lowercase]',
})
export class LowercaseFormControlDirective {
  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event.target'])
  public onInput(input: HTMLInputElement): void {
    const caretPos = input.selectionStart;
    this.ngControl.control?.setValue(input.value.toLocaleLowerCase());
    input.setSelectionRange(caretPos, caretPos);
  }
}
