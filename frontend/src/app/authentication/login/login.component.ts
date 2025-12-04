import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { FormErrors } from "src/app/shared/gds/error-summary/error-summary.component";
import { AuthenticationService } from "../authentication.service";
import { AuthenticatedUserService } from "../authenticated-user.service";
import { LoginResponse } from "../../../generated/graphql";

@Component({
  selector: "app-auth-login",
  templateUrl: "./login.component.html",
  standalone: false,
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = true;
  submitted = false;
  errors: FormErrors[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: AuthenticatedUserService,
  ) {
    this.loginForm = this.formBuilder.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
    });
  }

  ngOnInit() {
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetForm();
    });
    const postLoginLink = this.route.snapshot.queryParams.returnUrl ?? "/";
    //this.authenticationService.isAuthenticated$
    this.userService.loginResponse$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loginResponse) => {
        if (!loginResponse?.success) {
          if (!this.submitted) {
            return;
          }
          this.setErrorMessages(loginResponse);
          return;
        }
        this.loading = false;
        this.router.navigateByUrl(postLoginLink).catch(console.log);
      });
  }

  setErrorMessages(loginResponse: LoginResponse) {
    if (loginResponse.locked && loginResponse.unlockAt) {
      const unlockDate = new Date(loginResponse.unlockAt);
      const now = new Date();
      const diffMs = unlockDate.getTime() - now.getTime();
      const diffMins = Math.max(Math.ceil(diffMs / 60000), 0);

      this.errors.push({
        error: `Your account is locked for ${diffMins} minutes.`,
        label: "login-username",
      });

      return;
    }

    this.errors.push({
      error: `Invalid username or password. You have ${loginResponse.maxAttempts - (loginResponse.failedAttempts ?? 0)} attempts remaining before your account is locked.`,
      label: "login-username",
    });
    return;
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
    this.authenticationService.login(
      this.f?.username.value,
      this.f?.password.value,
    );
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(prop: AbstractControl) {
    if (prop.errors?.required) {
      return "This field is required.";
    }
  }

  getError(controlName: string) {
    const prop = this.loginForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }

  onEmailBlur() {
    this.router
      .navigate(["./"], { skipLocationChange: true })
      .catch(console.log);
  }
}
