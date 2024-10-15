import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Apollo } from "apollo-angular";
import { fromEvent, Observable, of } from "rxjs";
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  switchMap,
} from "rxjs/operators";
import { UserGQL, LoginGQL, LogoutGQL } from "../../generated/graphql";
import { HideOutliersService } from "../corridors/view/hide-outliers.service";
import { OtpThresholdDefaultsService } from "../on-time/otp-threshold-form/otp-threshold-defaults.service";
import { AuthenticatedUserService } from "./authenticated-user.service";
import { ConfigService } from "../config/config.service";
import { SessionService } from "./session.service";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  constructor(
    private apollo: Apollo,
    private loginMutation: LoginGQL,
    private logoutMutation: LogoutGQL,
    private userQuery: UserGQL,
    private router: Router,
    private userService: AuthenticatedUserService,
    private hideOutliersService: HideOutliersService,
    private otpThresholdDefaultsService: OtpThresholdDefaultsService,
    private configService: ConfigService,
    private sessionService: SessionService,
  ) {
    this.checkSession();
    this.userService.isAuthenticated$
      .pipe(
        distinctUntilChanged(),
        switchMap((isAuth) => {
          if (isAuth) {
            return this.userQuery
              .fetch({})
              .pipe(map((u) => u.data?.user ?? null));
          } else {
            return of(null);
          }
        }),
      )
      .subscribe((user) => this.userService.setUser(user));

    // Listen to storage event to check if user has logged out in another tab/window
    fromEvent(window, "storage")
      .pipe(
        filter(
          (e: Event) =>
            (e as StorageEvent).key === this.sessionService.STORE_SESSION_KEY,
        ),
        switchMap(() => of(this.sessionService.isSessionAlive())),
      )
      .subscribe((isAlive: boolean) => {
        if (isAlive) {
          this.userService.authenticateUser();
        } else {
          this.userService.deauthenticateUser();
          this.onDeauthentication();
        }
      });
  }

  login(username: string, password: string) {
    this.loginMutation
      .mutate({ username, password })
      .pipe(first())
      .subscribe((res) => {
        if (res?.data?.login?.success) {
          this.userService.authenticateUser();
          this.sessionService.setSession(
            JSON.stringify({
              expiresAt: res.data.login.expiresAt,
            }),
          );
          this.configService.loadConfig();
        } else {
          this.userService.deauthenticateUser();
        }
      });
  }

  logout() {
    this.logoutMutation
      .mutate()
      .pipe(first())
      .subscribe(({ data }) => {
        if (data?.logout) {
          this.userService.deauthenticateUser();
        } else {
          console.error("Logout failed!");
        }
      });
    this.userService.deauthenticateUser();
    this.onDeauthentication();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.userService.isAuthenticated$;
  }

  checkSession() {
    if (this.sessionService.isSessionAlive()) {
      this.userService.authenticateUser();
    } else {
      this.userService.deauthenticateUser();
    }
  }

  private onDeauthentication() {
    this.hideOutliersService.resetAll();
    this.otpThresholdDefaultsService.resetAll();
    this.apollo.client.resetStore().catch(console.log);
    this.sessionService.clearSession();
    this.router.navigate(["/login"]).catch(console.log);
  }
}
