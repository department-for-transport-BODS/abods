import { FormControl } from '@angular/forms';
import { CustomValidators } from './custom-validators';
import { DateTime, Interval } from 'luxon';

describe('CustomValidators', () => {
  describe('CustomValidators.requiredNoWhitespace', () => {
    const expectedError = { required: true };

    it('should return error if value is null', () => {
      const control = new FormControl(null);

      expect(CustomValidators.requiredNoWhitespace(control)).toEqual(expectedError);
    });

    it('should return error if value is undefined', () => {
      const control = new FormControl(undefined);

      expect(CustomValidators.requiredNoWhitespace(control)).toEqual(expectedError);
    });

    it('should return error if value is empty string', () => {
      const control = new FormControl('');

      expect(CustomValidators.requiredNoWhitespace(control)).toEqual(expectedError);
    });

    it('should return error if value is empty array', () => {
      const control = new FormControl([]);

      expect(CustomValidators.requiredNoWhitespace(control)).toEqual(expectedError);
    });

    it('should return error if value is only whitespace', () => {
      const control = new FormControl(' ');

      expect(CustomValidators.requiredNoWhitespace(control)).toEqual(expectedError);
    });

    it('should not error if value is array', () => {
      const control = new FormControl([1, 2]);

      expect(CustomValidators.requiredNoWhitespace(control)).toBeNull();
    });

    it('should not error on an object containing a length attribute that is zero', () => {
      const control = new FormControl({ id: 1, length: 0, width: 0 });

      expect(CustomValidators.requiredNoWhitespace(control)).toBeNull();
    });

    it('should not error if value is 0', () => {
      const control = new FormControl(0);

      expect(CustomValidators.requiredNoWhitespace(control)).toBeNull();
    });

    it('should not error if value is non-empty string', () => {
      const control = new FormControl('valid');

      expect(CustomValidators.requiredNoWhitespace(control)).toBeNull();
    });

    it('should not error if value is non-empty string with whitespace', () => {
      const control = new FormControl('  valid  ');

      expect(CustomValidators.requiredNoWhitespace(control)).toBeNull();
    });

    it('should not trim whitespace', () => {
      const control = new FormControl('  valid  ');
      CustomValidators.requiredNoWhitespace(control);

      expect(control.value).toBe('  valid  ');
    });
  });

  describe('CustomValidators.dateWithinRange', () => {
    let control: FormControl;

    beforeEach(() => {
      control = new FormControl(null, CustomValidators.dateWithinRange(Interval.fromISO('P6M/2022-09-01')));
    });

    it('should accept an empty value', () => {
      control.setValue(null);

      expect(control.valid).toBeTrue();

      control.setValue(undefined);

      expect(control.valid).toBeTrue();

      control.setValue('');

      expect(control.valid).toBeTrue();
    });

    it('should tolerate non-date values', () => {
      control.setValue('this isnt a date');

      expect(control.valid).toBeTrue();

      control.setValue(42);

      expect(control.valid).toBeTrue();
    });

    it('should accept dates within the specified interval', () => {
      control.setValue(DateTime.fromISO('2022-06-01'));

      expect(control.valid).toBeTrue();

      control.setValue(DateTime.fromISO('2022-08-31T23:59'));

      expect(control.valid).toBeTrue();

      control.setValue(DateTime.fromISO('2022-03-01T00:00'));

      expect(control.valid).toBeTrue();
    });

    it('should reject dates outside the specified interval', () => {
      control.setValue(DateTime.fromISO('2023-01-01'));

      expect(control.valid).toBeFalse();

      control.setValue(DateTime.fromISO('2022-09-01T00:00'));

      expect(control.valid).toBeFalse();

      control.setValue(DateTime.fromISO('2023-09-01'));

      expect(control.valid).toBeFalse();

      control.setValue(DateTime.fromISO('2022-02-28'));

      expect(control.valid).toBeFalse();

      control.setValue(DateTime.fromISO('1997-05-05'));

      expect(control.valid).toBeFalse();
    });

    it('should fail gracefully if the maximum date is not valid', () => {
      control.validator = CustomValidators.dateWithinRange(Interval.fromISO('not a valid interval'));
      control.setValue(DateTime.fromISO('2023-01-01'));

      expect(control.valid).toBeTrue();
    });
  });
});
