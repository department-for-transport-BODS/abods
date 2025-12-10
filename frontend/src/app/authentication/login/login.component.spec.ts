import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of } from "rxjs";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";
import { AuthenticationService } from "../authentication.service";
import { LoginComponent } from "./login.component";
import { AuthenticatedUserService } from "../authenticated-user.service";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authenticationService: AuthenticationService;
  let route: ActivatedRoute;
  let userService: AuthenticatedUserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forRoot([]),
        SharedModule,
        LayoutModule,
        ApolloTestingModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                returnUrl: undefined,
              },
            },
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            login: jasmine.createSpy("login"),
            get isAuthenticated$() {
              return of(false);
            },
          },
        },
        {
          provide: AuthenticatedUserService,
          useValue: {
            get loginResponse$() {
              return of({
                success: true,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                maxAttempts: 5,
                unlockAt: null,
                failedAttempts: null,
                locked: null,
              });
            },
          },
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    authenticationService = TestBed.inject(AuthenticationService);
    userService = TestBed.inject(AuthenticatedUserService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should redirect to returnUrl if user is authenticated", () => {
      const returnUrl = "test-url";
      route.snapshot.queryParams.returnUrl = returnUrl;
      const navigateSpy = spyOn(router, "navigateByUrl").and.resolveTo(true);
      component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledWith(returnUrl);
    });

    it('should redirect to "/" if user is authenticated and returnUrl not set', () => {
      const navigateSpy = spyOn(router, "navigateByUrl").and.resolveTo(true);

      component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledWith("/");
    });

    it("should not redirect to returnUrl if user is not authenticated", () => {
      const returnUrl = "test-url";
      route.snapshot.queryParams.returnUrl = returnUrl;
      const navigateSpy = spyOn(router, "navigateByUrl").and.resolveTo(true);
      spyOnProperty(userService, "loginResponse$", "get").and.returnValue(
        of({
          success: false,
          expiresAt: "2025-12-18T12:32:23.488Z",
          maxAttempts: 5,
          failedAttempts: 1,
        }),
      );
      component.ngOnInit();

      expect(navigateSpy).not.toHaveBeenCalledWith(returnUrl);
    });

    it("should not show error message if user is not authenticated and form not submitted", async () => {
      component.submitted = false;
      spyOn(router, "navigateByUrl").and.resolveTo(true);
      spyOnProperty(userService, "loginResponse$", "get").and.returnValue(
        of({
          success: false,
          expiresAt: "2025-12-18T12:32:23.488Z",
          maxAttempts: 5,
          failedAttempts: 1,
        }),
      );
      component.ngOnInit();

      await expect(component.errors).toEqual([]);
    });

    it("should show error message if user is not authenticated and form submitted", async () => {
      component.submitted = true;
      spyOn(router, "navigateByUrl").and.resolveTo(true);
      spyOnProperty(userService, "loginResponse$", "get").and.returnValue(
        of({
          success: false,
          expiresAt: "2025-12-18T12:32:23.488Z",
          maxAttempts: 5,
          failedAttempts: 1,
        }),
      );
      component.ngOnInit();

      await expect(component.errors).toEqual([
        {
          error:
            "Invalid username or password. You have 4 attempts remaining before your account is locked.",
          label: "login-username",
        },
      ]);
    });

    it("should show error message if user is locked", async () => {
      component.submitted = true;
      spyOn(router, "navigateByUrl").and.resolveTo(true);
      spyOnProperty(userService, "loginResponse$", "get").and.returnValue(
        of({
          success: false,
          expiresAt: "2025-12-18T12:32:23.488Z",
          unlockAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          maxAttempts: 5,
          failedAttempts: 5,
          locked: true,
        }),
      );
      component.ngOnInit();

      await expect(component.errors).toEqual([
        {
          error:
            "Your account is locked for 15 minutes due to multiple failed attempts. Please try again later or reset your password if required.",
          label: "login-username",
        },
      ]);
    });

    it("should show error message if user is not found", async () => {
      component.submitted = true;
      spyOn(router, "navigateByUrl").and.resolveTo(true);
      spyOnProperty(userService, "loginResponse$", "get").and.returnValue(
        of({
          success: false,
          expiresAt: null,
          maxAttempts: null,
          failedAttempts: null,
        }),
      );
      component.ngOnInit();

      await expect(component.errors).toEqual([
        {
          error: "Invalid username or password.",
          label: "login-username",
        },
      ]);
    });
  });

  describe("onSubmit", () => {
    it("should call login with username and password if form is valid", () => {
      component.f.username.setValue("test@test.com");
      component.f.password.setValue("testpass");
      component.onSubmit();

      expect(authenticationService.login).toHaveBeenCalledWith(
        "test@test.com",
        "testpass",
      );
    });

    it("should not call login with username and password if username is empty string", () => {
      component.f.username.setValue("");
      component.f.password.setValue("testpass");
      component.onSubmit();

      expect(authenticationService.login).not.toHaveBeenCalledWith(
        "",
        "testpass",
      );
    });

    it("should not call login with username and password if password is empty string", () => {
      component.f.username.setValue("test@test.com");
      component.f.password.setValue("");
      component.onSubmit();

      expect(authenticationService.login).not.toHaveBeenCalledWith(
        "test@test.com",
        "",
      );
    });
  });

  describe("getError", () => {
    const requiredErrorMsg = "This field is required.";

    it("should return error if username is invalid and dirty", async () => {
      component.f.username.markAsDirty();

      await expect(component.getError("username")).toEqual(requiredErrorMsg);
    });

    it("should return error if username is invalid and touched", async () => {
      component.f.username.markAsTouched();

      await expect(component.getError("username")).toEqual(requiredErrorMsg);
    });

    it("should not return error if username is pristine", async () => {
      component.f.username.markAsPristine();

      await expect(component.getError("username")).toBeUndefined();
    });

    it("should not return error if username is valid", async () => {
      component.f.username.setValue("test@test.com");

      await expect(component.getError("username")).toBeUndefined();
    });

    it("should return error if password is invalid and dirty", async () => {
      component.f.password.markAsDirty();

      await expect(component.getError("password")).toEqual(requiredErrorMsg);
    });

    it("should return error if password is invalid and touched", async () => {
      component.f.password.markAsTouched();

      await expect(component.getError("password")).toEqual(requiredErrorMsg);
    });

    it("should not return error if password is pristine", async () => {
      component.f.password.markAsPristine();

      await expect(component.getError("password")).toBeUndefined();
    });

    it("should not return error if password is valid", async () => {
      component.f.password.setValue("testpass");

      await expect(component.getError("password")).toBeUndefined();
    });
  });
});
