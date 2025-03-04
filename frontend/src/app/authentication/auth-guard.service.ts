import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { AuthenticatedUserService } from "./authenticated-user.service";
import { AuthenticationService } from "./authentication.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuardService implements CanActivateChild, CanActivate {
  constructor(
    private router: Router,
    private userService: AuthenticatedUserService,
    private authService: AuthenticationService,
  ) {}

  canActivate(
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.userService.isAuthenticated$.pipe(
      tap((isAuthenticated) => {
        if (!isAuthenticated) {
          this.router
            .navigate(["/login"], { queryParams: { returnUrl: state.url } })
            .catch(console.log);
        }
      }),
    );
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.authService.isSessionAlive
      ? this.canActivate(childRoute, state)
      : this.redirectToLogin(childRoute, state);
  }

  redirectToLogin(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    this.router
      .navigate(["/login"], { queryParams: { returnUrl: state.url } })
      .catch(console.log);
    return of(false);
  }
}
