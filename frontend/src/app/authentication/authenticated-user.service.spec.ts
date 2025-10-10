import { TestBed } from "@angular/core/testing";
import { AuthenticatedUserService } from "./authenticated-user.service";

describe("AuthenticatedUserService", () => {
  let service: AuthenticatedUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthenticatedUserService] });
    service = TestBed.inject(AuthenticatedUserService);
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  it("should return true if authenticated", () => {
    service.authenticateUser();
    service.isAuthenticated$.subscribe((isAuth) => {
      expect(isAuth).toBeTrue();
    });
  });

  it("should return false if not authenticated", () => {
    service.deauthenticateUser();
    service.isAuthenticated$.subscribe((isAuth) => {
      expect(isAuth).toBeFalse();
    });
  });

  it("should return authenticated user", () => {
    spyOn(service.authenticatedUser$, "subscribe");
    service.setUser({
      canEditAllAlerts: true,
      canViewDistances: true,
      canViewServiceMonitoring: false,
      currentUserId: "111",
      flags: [],
    });
    service.authenticatedUser$.subscribe((user) => {
      expect(user.canEditAllAlerts).toBeTrue();
      expect(user.canViewDistances).toBeTrue();
      expect(user.canViewServiceMonitoring).toBeFalse();
    });
  });
});
