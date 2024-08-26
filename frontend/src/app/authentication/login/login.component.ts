import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-auth-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = true;
  submitted = false;
  returnUrl?: string;
  errors: FormErrors[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetForm();
    });
    this.returnUrl = this.route.snapshot.queryParams.returnUrl;
    this.authenticationService.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe((isAuth) => {
      if (isAuth) {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl ?? '/');
      } else {
        if (this.submitted) {
          this.errors.push({
            error: 'Sign in failed, check username and password.',
            label: 'login-username',
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetForm() {
    this.errors = [];
    this.submitted = false;
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm?.controls;
  }

  onSubmit() {
    this.resetForm();
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm?.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authenticationService.login(this.f?.username.value, this.f?.password.value);
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(prop: AbstractControl) {
    if (prop.errors?.required) {
      return 'This field is required.';
    }
  }

  getError(controlName: string) {
    const prop = this.loginForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }

  onEmailBlur() {
    this.router.navigate(['./'], { skipLocationChange: true });
  }
}
