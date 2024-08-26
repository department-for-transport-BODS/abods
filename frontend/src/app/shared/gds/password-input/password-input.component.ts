import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

@Component({
  selector: 'gds-password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input()
  get inputId(): string {
    return this._id || this._uid;
  }
  set inputId(value: string) {
    this._id = value;
  }

  protected _uid = `gds-password-input-${nextUniqueId++}`;
  protected _id = '';

  @Input() width?: '10' | '20';
  @Input() label?: string;
  @Input() error?: string;
  @Input() required = false;
  @Input() autocomplete?: string;

  control = new FormControl();
  suffixLabel = 'Show';
  type = 'password';

  get inputClasses() {
    return {
      'govuk-input password-input__input': true,
      [`password-input__width--${this.width}`]: this.width,
      'govuk-input--error': this.error,
    };
  }

  onTouch: (_: unknown) => void = () => {
    // Do nothing
  };

  writeValue(value: unknown) {
    this.control.patchValue(value);
  }

  registerOnChange(fn: (_: unknown) => any) {
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: (_: unknown) => any) {
    this.onTouch = fn;
  }

  hidePassword() {
    this.suffixLabel = 'Show';
    this.type = 'password';
  }

  showPassword() {
    this.suffixLabel = 'Hide';
    this.type = 'text';
  }
}
