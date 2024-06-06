import { TestBed } from '@angular/core/testing';
import { UserFragment } from '../../generated/graphql';
import { AuthenticatedUserService } from './authenticated-user.service';

describe('AuthenticatedUserService', () => {
  let service: AuthenticatedUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthenticatedUserService] });
    service = TestBed.inject(AuthenticatedUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return true if authenticated', () => {
    service.authenticateUser();
    service.isAuthenticated$.subscribe((isAuth) => {
      expect(isAuth).toBeTrue();
    });
  });

  it('should return false if not authenticated', () => {
    service.deauthenticateUser();
    service.isAuthenticated$.subscribe((isAuth) => {
      expect(isAuth).toBeFalse();
    });
  });

  it('should return authenticated user', () => {
    spyOn(service.authenticatedUser$, 'subscribe');
    service.setUser(<UserFragment>{ id: '111' });
    service.authenticatedUser$.subscribe((user) => {
      expect(user.id).toEqual('111');
    });
  });
});
