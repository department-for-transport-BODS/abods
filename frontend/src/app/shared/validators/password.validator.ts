import { FormGroup, ValidationErrors, Validators } from '@angular/forms';

export class PasswordValidator {
  static passwordPolicyText = [
    'be at least 8 characters long',
    'contain at least one number',
    'contain both lowercase and uppercase characters',
    'contain at least one special character',
  ];

  static getErrorText(errors: { [key: string]: boolean }): string | undefined {
    if (errors.minlength) {
      return 'Password must be at least 8 characters long.';
    }
    if (errors.lowerCase) {
      return 'Password must contain at least one lowercase character.';
    }
    if (errors.upperCase) {
      return 'Password must contain at least one uppercase character.';
    }
    if (errors.digits) {
      return 'Password must contain at least one number.';
    }
    if (errors.specialChars) {
      return 'Password must contain at least one special character.';
    }
    if (errors.mismatch) {
      return 'Passwords do not match.';
    }
  }

  static digits(control: FormGroup): ValidationErrors | null {
    const password = control.value;
    if (password.match(/\d+/)) {
      return null;
    }
    return { digits: true };
  }

  static lowerCase(control: FormGroup): ValidationErrors | null {
    const password = control.value;
    if (password.match(/[a-z]/)) {
      return null;
    }
    return { lowerCase: true };
  }

  static upperCase(control: FormGroup): ValidationErrors | null {
    const password = control.value;
    if (password.match(/[A-Z]/)) {
      return null;
    }
    return { upperCase: true };
  }

  static specialChars(control: FormGroup): ValidationErrors | null {
    const password = control.value;
    if (password?.match(/[^A-Za-z0-9]/)) {
      return null;
    }
    return { specialChars: true };
  }

  static get passwordValidators() {
    return [
      Validators.minLength(8),
      PasswordValidator.digits,
      PasswordValidator.specialChars,
      PasswordValidator.lowerCase,
      PasswordValidator.upperCase,
    ];
  }

  static confirmPasswords(passwordField: string): (control: FormGroup) => ValidationErrors | null {
    return (control: FormGroup) => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control?.value;
      return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
    };
  }
}
