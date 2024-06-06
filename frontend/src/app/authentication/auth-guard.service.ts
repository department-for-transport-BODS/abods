import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthenticatedUserService } from './authenticated-user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivateChild, CanActivate {
  constructor(private router: Router, private userService: AuthenticatedUserService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.userService.isAuthenticated$.pipe(
      switchMap((isAuthenticated) => {
        if (isAuthenticated) {
          return this.userService.authenticatedUser$.pipe(
            map((user) => {
              if (
                route.data.roles &&
                !route.data.roles.some((requiredRole: string) => requiredRole === user.roles[0].name)
              ) {
                this.router.navigate(['/not-authorised'], { queryParams: { url: state.url } });
                return false;
              }

              return true;
            })
          );
        } else {
          // not logged in so redirect to login page with the return url
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        }
      })
    );
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(childRoute, state);
  }
}
