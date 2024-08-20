import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { PasswordValidator } from 'src/app/shared/validators/password.validator';
import { UserService } from '../user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  subscriptions: Subscription[] = [];
  formSubscription?: Subscription;
  routeSubscription?: Subscription;
  errors: FormErrors[] = [];
  keyChecked = false;
  keyOk = false;
  resetSuccess = false;
  passwordPolicy = PasswordValidator.passwordPolicyText;
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private userService: UserService) {
    this.resetPasswordForm = this.formBuilder.group(
      {
        key: [''],
        uid: [''],
        password: ['', [Validators.required, Validators.minLength(8), ...PasswordValidator.passwordValidators]],
        confirmPassword: ['', [Validators.required, PasswordValidator.confirmPasswords('password')]],
      },
      { validators: PasswordValidator.confirmPasswords }
    );
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.paramMap
        .pipe(
          filter((params: ParamMap) => !(!params.get('uid') || !params.get('key'))),
          map((params: ParamMap) => {
            const uid = params.get('uid') as string;
            const key = params.get('key') as string;
            this.uid?.setValue(uid);
            this.key?.setValue(key);
            return [uid, key];
          }),
          switchMap(([uid, key]) => this.userService.verifyResetPasswordToken$(uid, key)),
          tap((_) => (this.keyChecked = true))
        )
        .subscribe((res) => {
          this.keyOk = res || false;
        }),
      this.resetPasswordForm.controls.password.valueChanges.subscribe(() => {
        this.resetPasswordForm.controls.confirmPassword.updateValueAndValidity();
      }),
      (this.formSubscription = this.resetPasswordForm.valueChanges
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(() => {
          this.resetForm();
        }))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subs) => subs.unsubscribe());
  }

  private resetForm() {
    this.errors = [];
    this.submitted = false;
  }

  onSubmit() {
    this.resetForm();
    this.submitted = true;

    // stop here if form is invalid
    if (this.resetPasswordForm?.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.subscriptions.push(
      this.userService
        .resetPassword$(this.uid?.value, this.key?.value, this.password?.value, this.confirmPassword?.value)
        .subscribe((res) => {
          if (res?.error) {
            this.errors?.push({ error: res.error });
          } else {
            this.resetSuccess = true;
          }
          this.loading = false;
        })
    );
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(prop: AbstractControl) {
    if (prop.errors) {
      if (prop.errors.required) {
        return 'This field is required.';
      }
      return PasswordValidator.getErrorText(prop.errors);
    }
  }

  getError(controlName: string) {
    const prop = this.resetPasswordForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }

  get username() {
    return this.resetPasswordForm.get('username');
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  get key() {
    return this.resetPasswordForm.get('key');
  }

  get uid() {
    return this.resetPasswordForm.get('uid');
  }
}
