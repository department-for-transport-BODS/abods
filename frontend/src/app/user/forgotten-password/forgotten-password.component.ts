import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { UserService } from '../user.service';

@Component({
  selector: 'app-forgotten-password',
  templateUrl: './forgotten-password.component.html',
})
export class ForgottenPasswordComponent implements OnInit, OnDestroy {
  forgottenPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  subs: Subscription[] = [];
  errors: FormErrors[] = [];

  resetSuccess = false;

  constructor(private formBuilder: FormBuilder, private userService: UserService) {
    this.forgottenPasswordForm = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
      },
      { updateOn: 'blur' }
    );
  }

  ngOnInit() {
    this.subs.push(
      this.forgottenPasswordForm.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe(() => {
        this.resetForm();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((subs) => subs.unsubscribe());
  }

  private resetForm() {
    this.errors = [];
    this.submitted = false;
  }

  onSubmit() {
    if (this.forgottenPasswordForm.invalid) {
      this.forgottenPasswordForm.markAllAsTouched();
      return;
    }
    this.submitted = true;
    this.loading = true;

    const email = this.forgottenPasswordForm.controls.email.value;

    this.subs.push(
      this.userService.requestResetPassword$(email).subscribe((res) => {
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
    if (prop.errors?.required || prop.errors?.email) {
      return 'Please enter a valid email address.';
    }
  }

  getError(controlName: string) {
    const prop = this.forgottenPasswordForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }
}
