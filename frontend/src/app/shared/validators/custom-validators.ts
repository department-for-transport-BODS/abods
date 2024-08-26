import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { requiredNoWhitespaceValidator } from './required-no-whitespace.validator';
import { DateTime, Interval } from 'luxon';

export class CustomValidators {
  /**
   * Validator that checks for value in control.
   * If value is null, undefined or empty string error is returned.
   * Strings with only whitespace characters will return an error.
   * @param control
   * @returns `ValidationErrors | null`
   */
  static requiredNoWhitespace(control: AbstractControl): ValidationErrors | null {
    return requiredNoWhitespaceValidator(control);
  }

  /**
   * Checks that the control value is within the start and end of the specified interval.
   * @param range The range of dates that should be considered valid
   */
  static dateWithinRange = (range: Interval): ValidatorFn => (control) =>
    control.value instanceof DateTime && control.value.isValid && range.isValid && !range.contains(control.value)
      ? { dateWithinRange: true }
      : null;
}
