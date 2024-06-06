import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloQueryResult } from '@apollo/client';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of, take } from 'rxjs';
import { LoginGQL, LoginMutation, LogoutGQL, LogoutMutation, UserGQL, UserQuery } from '../../generated/graphql';
import { AuthenticatedUserService } from './authenticated-user.service';

import { AuthenticationService } from './authentication.service';

@Component({ template: '', selector: 'app-mock-login' })
export class MockLoginComponent {}

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userQuery: UserGQL;
  let userService: AuthenticatedUserService;
  let loginMutation: LoginGQL;
  let logoutMutation: LogoutGQL;
  let router: Router;

  const username = 'test@test.con';
  const password = 'testpass1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'login', component: MockLoginComponent }]),
        HttpClientTestingModule,
        ApolloTestingModule,
      ],
      providers: [UserGQL, AuthenticatedUserService, LoginGQL, LogoutGQL],
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should call userQuery if user is authenticated', () => {
      spyOn(userQuery, 'fetch').and.returnValue(of(<ApolloQueryResult<UserQuery>>{}));
      userService.authenticateUser();

      expect(userQuery.fetch).toHaveBeenCalledWith();
    });

    it('should not call userQuery if user is not authenticated', () => {
      spyOn(userQuery, 'fetch').and.returnValue(of(<ApolloQueryResult<UserQuery>>{}));
      userService.deauthenticateUser();

      expect(userQuery.fetch).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should call loginMutation.mutate with username and password', () => {
      spyOn(loginMutation, 'mutate').and.returnValue(of(<ApolloQueryResult<LoginMutation>>{}));
      service.login(username, password);

      expect(loginMutation.mutate).toHaveBeenCalledWith({ username, password });
    });

    describe('on successful login', () => {
      beforeEach(() => {
        spyOn(loginMutation, 'mutate').and.returnValue(
          of(<ApolloQueryResult<LoginMutation>>{
            data: { login: { success: true, expiresAt: '2022-08-01T12:48:48.672212+00:00' } },
          })
        );
        service.login(username, password);
      });

      it('should set session expiry date', () => {
        expect(service.getSession()).toEqual('{"expiresAt":"2022-08-01T12:48:48.672212+00:00"}');
      });

      it('should set isAuthenticatedSubject to true', () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeTrue();
        });
      });
    });

    describe('on unsuccessful login', () => {
      beforeEach(() => {
        spyOn(loginMutation, 'mutate').and.returnValue(
          of(<ApolloQueryResult<LoginMutation>>{
            data: { login: { success: false } },
          })
        );
        service.login(username, password);
      });

      it('should not set session expiry on unsuccessful login', () => {
        expect(service.getSession()).toBeNull();
      });

      it('should set isAuthenticatedSubject to false on unsuccessful login', () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      spyOn(loginMutation, 'mutate').and.returnValue(
        of(<ApolloQueryResult<LoginMutation>>{
          data: { login: { success: true, expiresAt: '2022-08-01T12:48:48.672212+00:00' } },
        })
      );
      service.login(username, password);
    });

    it('should call logoutMutation.mutate', () => {
      spyOn(logoutMutation, 'mutate').and.returnValue(of(<ApolloQueryResult<LogoutMutation>>{}));
      service.logout();

      expect(logoutMutation.mutate).toHaveBeenCalledWith();
    });

    describe('on successful logout', () => {
      beforeEach(() => {
        spyOn(logoutMutation, 'mutate').and.returnValue(
          of(<ApolloQueryResult<LogoutMutation>>{ data: { logout: true } })
        );
        spyOn(router, 'navigate');
        service.logout();
      });

      it('should set isAuthenticatedSubject to false on successful logout', () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });

      it('should clear session on successful logout', () => {
        expect(service.getSession()).toBeNull();
      });

      it('should navigate to login on successful logout', () => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    describe('on unsuccessful logout', () => {
      beforeEach(() => {
        spyOn(logoutMutation, 'mutate').and.returnValue(
          of(<ApolloQueryResult<LogoutMutation>>{ data: { logout: false } })
        );
        spyOn(router, 'navigate');
        service.logout();
      });

      it('should set isAuthenticatedSubject to false on unsuccessful logout', () => {
        service.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
        });
      });

      it('should clear session on unsuccessful logout', () => {
        expect(service.getSession()).toBeNull();
      });

      it('should navigate to login on unsuccessful logout', () => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });
  });

  describe('isSessionAlive', () => {
    it('should return false if there is no session in local storage', () => {
      expect(service.isSessionAlive).toBeFalse();
    });

    it('should return false if current timestamp is greater than session expiry timestamp', () => {
      const session = '{"expiresAt":"2022-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive).toBeFalse();
    });

    it('should return true if current timestamp is less than session expiry timestamp', () => {
      const session = '{"expiresAt":"2122-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive).toBeTrue();
    });
  });
});
