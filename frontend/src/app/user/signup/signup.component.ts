import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { PasswordValidator } from 'src/app/shared/validators/password.validator';
import { InvitationType } from 'src/generated/graphql';
import { UserService } from '../user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
})
export class SignupComponent implements OnInit, OnDestroy {
  signUpForm: FormGroup;
  loading = false;
  submitted = false;
  subscriptions: Subscription[] = [];
  formSubscription?: Subscription;
  routeSubscription?: Subscription;
  errors: FormErrors[] = [];
  invitation?: InvitationType | null;
  invitationFetched = false;
  signUpSuccess = false;
  passwordPolicy = PasswordValidator.passwordPolicyText;
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private signUpService: UserService) {
    this.signUpForm = this.formBuilder.group({
      key: [''],
      firstName: [
        '',
        [Validators.required, Validators.pattern(/^(\s*[\p{Letter}'().,&/-]+\s*)*(?!\s)[\p{Letter}'().,&/-]*$/u)],
      ],
      lastName: [
        '',
        [Validators.required, Validators.pattern(/^(\s*[\p{Letter}'().,&/-]+\s*)*(?!\s)[\p{Letter}'().,&/-]*$/u)],
      ],
      password: ['', [Validators.required, ...PasswordValidator.passwordValidators]],
      confirmPassword: ['', [Validators.required, PasswordValidator.confirmPasswords('password')]],
    });
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.paramMap.subscribe((params: ParamMap) => {
        if (params.get('key')) {
          this.key.setValue(params.get('key'));
          this.signUpService.invitation$(params.get('key') as string).subscribe((res) => {
            this.invitationFetched = true;
            this.invitation = res;
          });
        }
      }),
      this.signUpForm.controls.password.valueChanges.subscribe(() => {
        this.signUpForm.controls.confirmPassword.updateValueAndValidity();
      })
    );
    this.subscriptions.push(
      (this.formSubscription = this.signUpForm.valueChanges
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

  // convenience getter for easy access to form fields
  get f() {
    return this.signUpForm.controls;
  }

  onSubmit() {
    this.resetForm();
    this.submitted = true;

    // stop here if form is invalid
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.subscriptions.push(
      this.signUpService
        .signUp$(this.key.value, this.password.value, this.firstName.value.trim(), this.lastName.value.trim())
        .subscribe((res) => {
          if (res.error) {
            this.errors.push({ error: res.error });
          } else {
            this.signUpSuccess = true;
          }
          this.loading = false;
        })
    );
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(controlName: string, prop: AbstractControl) {
    if (prop.errors) {
      if (prop.errors.required) {
        return 'This field is required.';
      } else if (prop.errors.pattern) {
        if (controlName === 'firstName' || controlName === 'lastName') {
          return 'Name contains an invalid character';
        }
      }
      return PasswordValidator.getErrorText(prop.errors);
    }
  }

  getError(controlName: string) {
    const prop = this.signUpForm.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(controlName, prop);
    }
  }

  get firstName() {
    return this.signUpForm.get('firstName') as AbstractControl;
  }

  get lastName() {
    return this.signUpForm.get('lastName') as AbstractControl;
  }

  get username() {
    return this.signUpForm.get('username') as AbstractControl;
  }

  get password() {
    return this.signUpForm.get('password') as AbstractControl;
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword') as AbstractControl;
  }

  get key() {
    return this.signUpForm.get('key') as AbstractControl;
  }
}
