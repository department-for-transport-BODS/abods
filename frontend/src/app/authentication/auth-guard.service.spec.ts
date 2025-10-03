import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterModule,
  RouterStateSnapshot,
} from "@angular/router";
import { createSpyObject } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of } from "rxjs";
import { AuthGuardService } from "./auth-guard.service";
import { AuthenticatedUserService } from "./authenticated-user.service";
import { AuthenticationService } from "./authentication.service";
import { MockLoginComponent } from "./authentication.service.spec";

describe("AuthGuardService", () => {
  let service: AuthGuardService;
  let router: Router;
  let userService: AuthenticatedUserService;
  let authService: AuthenticationService;

  let mockRouterStateSnapshot: RouterStateSnapshot;
  let mockActivatedRouteSnapshot: ActivatedRouteSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([
          { path: "login", component: MockLoginComponent },
        ]),
        ApolloTestingModule,
      ],
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(AuthGuardService);
    router = TestBed.inject(Router);
    userService = TestBed.inject(AuthenticatedUserService);
    authService = TestBed.inject(AuthenticationService);

    mockActivatedRouteSnapshot = createSpyObject<ActivatedRouteSnapshot>(
      ActivatedRouteSnapshot,
    );
    mockRouterStateSnapshot =
      createSpyObject<RouterStateSnapshot>(RouterStateSnapshot);
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  describe("canActivate", () => {
    describe("user is not authenticated", () => {
      beforeEach(() => {
        spyOnProperty(userService, "isAuthenticated$").and.returnValue(
          of(false),
        );
        spyOn(router, "navigate").and.resolveTo(true);
      });

      it("should return false", () => {
        service
          .canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot)
          .subscribe((activate: boolean) => {
            expect(activate).toBeFalse();
          });
      });

      it("should navigate to login with returnUrl", () => {
        mockRouterStateSnapshot.url = "/dashboard";
        service
          .canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot)
          .subscribe();

        expect(router.navigate).toHaveBeenCalledWith(["/login"], {
          queryParams: { returnUrl: "/dashboard" },
        });
      });
    });

    describe("user is authenticated", () => {
      beforeEach(() => {
        spyOnProperty(userService, "isAuthenticated$").and.returnValue(
          of(true),
        );
      });

      it("should return true", () => {
        spyOnProperty(userService, "authenticatedUser$").and.returnValue(
          of({}),
        );

        service
          .canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot)
          .subscribe((activate) => {
            expect(activate).toBeTrue();
          });
      });
    });
  });

  describe("canActivateChild", () => {
    it("should call canActivate with childRoute and state", () => {
      spyOn(service, "canActivate");

      spyOnProperty(authService, "isSessionAlive", "get").and.returnValue(true);

      service.canActivateChild(
        mockActivatedRouteSnapshot,
        mockRouterStateSnapshot,
      );

      expect(service.canActivate).toHaveBeenCalledOnceWith(
        mockActivatedRouteSnapshot,
        mockRouterStateSnapshot,
      );
    });
  });
});
