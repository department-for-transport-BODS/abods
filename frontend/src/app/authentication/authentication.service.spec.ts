import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, RouterModule } from "@angular/router";
import { ApolloQueryResult } from "@apollo/client";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of, take } from "rxjs";
import {
  LoginGQL,
  LoginMutation,
  LogoutGQL,
  UserGQL,
  UserQuery,
} from "../../generated/graphql";
import { AuthenticatedUserService } from "./authenticated-user.service";
import { AuthenticationService } from "./authentication.service";

@Component({
  template: "",
  selector: "app-mock-login",
  standalone: false,
})
export class MockLoginComponent {}

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  let userQuery: UserGQL;
  let userService: AuthenticatedUserService;
  let loginMutation: LoginGQL;
  let logoutMutation: LogoutGQL;
  let router: Router;

  const username = "test@test.con";
  const password = "testpass1";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([
          { path: "login", component: MockLoginComponent },
        ]),
        ApolloTestingModule,
      ],
      providers: [
        UserGQL,
        AuthenticatedUserService,
        LoginGQL,
        LogoutGQL,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthenticationService);
    userQuery = TestBed.inject(UserGQL);
    userService = TestBed.inject(AuthenticatedUserService);
    loginMutation = TestBed.inject(LoginGQL);
    logoutMutation = TestBed.inject(LogoutGQL);
    router = TestBed.inject(Router);

    userService.deauthenticateUser();
    service.clearSession();
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  describe("constructor", () => {
    it("should call userQuery if user is authenticated", () => {
      const spyUserQuery = spyOn(userQuery, "fetch").and.returnValue(
        of({} as ApolloQueryResult<UserQuery>),
      );
      userService.authenticateUser();

      expect(spyUserQuery).toHaveBeenCalledWith({});
    });

    it("should not call userQuery if user is not authenticated", async () => {
      const spyUserQuery = spyOn(userQuery, "fetch").and.returnValue(
        of({} as ApolloQueryResult<UserQuery>),
      );
      userService.deauthenticateUser();

      await expect(spyUserQuery).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should call loginMutation.mutate with username and password", () => {
      const spyLoginMutation = spyOn(loginMutation, "mutate").and.returnValue(
        of({} as ApolloQueryResult<LoginMutation>),
      );
      service.login(username, password);

      expect(spyLoginMutation).toHaveBeenCalledWith({ username, password });
    });

    describe("on successful login", () => {
      beforeEach(() => {
        spyOn(loginMutation, "mutate").and.returnValue(
          of({
            data: {
              login: {
                success: true,
                expiresAt: "2022-08-01T12:48:48.672212+00:00",
              },
            },
          } as ApolloQueryResult<LoginMutation>),
        );
        service.login(username, password);
      });

      it("should set session expiry date", async () => {
        await expect(service.getSession()).toEqual(
          '{"expiresAt":"2022-08-01T12:48:48.672212+00:00"}',
        );
      });

      it("should set isAuthenticatedSubject to true", () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeTrue();
        });
      });
    });

    describe("on unsuccessful login", () => {
      beforeEach(() => {
        spyOn(loginMutation, "mutate").and.returnValue(
          of({
            data: { login: { success: false } },
          } as ApolloQueryResult<LoginMutation>),
        );
        service.login(username, password);
      });

      it("should not set session expiry on unsuccessful login", async () => {
        await expect(service.getSession()).toBeNull();
      });

      it("should set isAuthenticatedSubject to false on unsuccessful login", () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      spyOn(loginMutation, "mutate").and.returnValue(
        of({
          data: {
            login: {
              success: true,
              expiresAt: "2022-08-01T12:48:48.672212+00:00",
              maxAttempts: 5,
            },
          },
        }),
      );
      service.login(username, password);
    });

    it("should call logoutMutation.mutate", () => {
      const spyLogout = spyOn(logoutMutation, "mutate").and.returnValue(of({}));
      service.logout();

      expect(spyLogout).toHaveBeenCalledWith();
    });

    describe("on successful logout", () => {
      beforeEach(() => {
        spyOn(logoutMutation, "mutate").and.returnValue(
          of({ data: { logout: true } }),
        );
        spyOn(router, "navigate").and.resolveTo(true);
        service.logout();
      });

      it("should set isAuthenticatedSubject to false on successful logout", () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });

      it("should clear session on successful logout", async () => {
        await expect(service.getSession()).toBeNull();
      });

      it("should navigate to login on successful logout", () => {
        expect(router.navigate).toHaveBeenCalledWith(["/login"]);
      });
    });

    describe("on unsuccessful logout", () => {
      beforeEach(() => {
        spyOn(logoutMutation, "mutate").and.returnValue(
          of({ data: { logout: false } }),
        );
        spyOn(router, "navigate").and.resolveTo(true);
        service.logout();
      });

      it("should set isAuthenticatedSubject to false on unsuccessful logout", () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });

      it("should clear session on unsuccessful logout", async () => {
        await expect(service.getSession()).toBeNull();
      });

      it("should navigate to login on unsuccessful logout", () => {
        expect(router.navigate).toHaveBeenCalledWith(["/login"]);
      });
    });
  });

  describe("isSessionAlive", () => {
    it("should return false if there is no session in local storage", () => {
      expect(service.isSessionAlive).toBeFalse();
    });

    it("should return false if current timestamp is greater than session expiry timestamp", () => {
      const session = '{"expiresAt":"2022-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive).toBeFalse();
    });

    it("should return true if current timestamp is less than session expiry timestamp", () => {
      const session = '{"expiresAt":"2122-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive).toBeTrue();
    });
  });
});
