import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createSpyObject } from '@ngneat/spectator';
import { of } from 'rxjs';
import { ScopeEnum, UserFragment } from '../../generated/graphql';

import { AuthGuardService } from './auth-guard.service';
import { AuthenticatedUserService } from './authenticated-user.service';
import { MockLoginComponent } from './authentication.service.spec';

describe('AuthGuardService', () => {
  let service: AuthGuardService;
  let router: Router;
  let userService: AuthenticatedUserService;

  let mockRouterStateSnapshot: RouterStateSnapshot;
  let mockActivatedRouteSnapshot: ActivatedRouteSnapshot;

  const user = {
    id: '1',
    email: 'test@test.con',
    username: 'test@test.con',
    firstName: 'Test',
    lastName: 'A',
    roles: [
      {
        id: '4',
        scope: ScopeEnum.Organisation,
        name: 'Administrator',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([{ path: 'login', component: MockLoginComponent }])],
    });
    service = TestBed.inject(AuthGuardService);
    router = TestBed.inject(Router);
    userService = TestBed.inject(AuthenticatedUserService);

    mockActivatedRouteSnapshot = createSpyObject<ActivatedRouteSnapshot>(ActivatedRouteSnapshot);
    mockRouterStateSnapshot = createSpyObject<RouterStateSnapshot>(RouterStateSnapshot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canActivate', () => {
    describe('user is not authenticated', () => {
      beforeEach(() => {
        spyOnProperty(userService, 'isAuthenticated$').and.returnValue(of(false));
        spyOn(router, 'navigate');
      });

      it('should return false', () => {
        service.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot).subscribe((activate) => {
          expect(activate).toBeFalse();
        });
      });

      it('should navigate to login with returnUrl', () => {
        mockRouterStateSnapshot.url = '/dashboard';
        service.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot).subscribe();

        expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
      });
    });

    describe('user is authenticated', () => {
      beforeEach(() => {
        spyOnProperty(userService, 'isAuthenticated$').and.returnValue(of(true));
        spyOn(router, 'navigate');
      });

      it('should return true if route roles is undefined', () => {
        spyOnProperty(userService, 'authenticatedUser$').and.returnValue(of(<UserFragment>{}));
        mockActivatedRouteSnapshot.data = { roles: undefined };
        service.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot).subscribe((activate) => {
          expect(activate).toBeTrue();
        });
      });

      it('should return true if user has matching route role', () => {
        user.roles[0].name = 'Administrator';
        spyOnProperty(userService, 'authenticatedUser$').and.returnValue(of(user));
        mockActivatedRouteSnapshot.data = { roles: ['Administrator'] };
        service.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot).subscribe((activate) => {
          expect(activate).toBeTrue();
        });
      });

      it('should return false if user does not have a matching route role', () => {
        user.roles[0].name = 'Staff';
        spyOnProperty(userService, 'authenticatedUser$').and.returnValue(of(user));
        mockActivatedRouteSnapshot.data = { roles: ['Administrator'] };
        service.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot).subscribe((activate) => {
          expect(activate).toBeFalse();
        });
      });
    });
  });

  describe('canActivateChild', () => {
    it('should call canActivate with childRoute and state', () => {
      spyOn(service, 'canActivate');
      service.canActivateChild(mockActivatedRouteSnapshot, mockRouterStateSnapshot);

      expect(service.canActivate).toHaveBeenCalledOnceWith(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    });
  });
});
