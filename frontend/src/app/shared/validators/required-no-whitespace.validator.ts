import { ValidationErrors, AbstractControl } from '@angular/forms';

const isEmptyInputValue = (value: any): boolean => {
  /**
   * Check if the object is a string or array before evaluating the length attribute.
   * This avoids falsely rejecting objects that contain a custom length attribute.
   * For example, the object {id: 1, length: 0, width: 0} should not be returned as empty.
   */
  return value == null || ((typeof value === 'string' || Array.isArray(value)) && value.length === 0);
};

const isEmptyTrimmedString = (value: any): boolean => {
  return typeof value === 'string' ? value.trim() == '' : false;
};

export const requiredNoWhitespaceValidator = (control: AbstractControl): ValidationErrors | null => {
  if (isEmptyInputValue(control.value) || isEmptyTrimmedString(control.value)) {
    return { required: true };
  }
  return null;
};
