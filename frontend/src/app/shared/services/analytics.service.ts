import { Injectable } from '@angular/core';
import { debounceTime, filter, first, map, mergeMap, skip } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { AuthenticatedUserService } from '../../authentication/authenticated-user.service';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { CookiePolicyService } from './cookie-policy.service';

export interface AnalyticsUserProperties {
  abodUserId: string;
  abodOrgId: string;
  abodOrgName: string;
}

/**
 * Provides additional tags to populate user properties.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  get userProperties$() {
    return this.userService.authenticatedUser$.pipe(
      map(
        (user) =>
          <AnalyticsUserProperties>{
            abodUserId: user?.id,
            abodOrgId: user?.organisation?.id,
            abodOrgName: user?.organisation?.name,
          }
      )
    );
  }

  constructor(
    private router: Router,
    private userService: AuthenticatedUserService,
    private tagManagerService: GoogleTagManagerService,
    private cookiePolicyService: CookiePolicyService
  ) {
    const policy = this.cookiePolicyService.getAnalyticsPolicy();
    policy.analyticsEnabled ? this.enableAnalytics() : this.disableAnalytics();
  }

  private analyticsEnabled$ = new BehaviorSubject<boolean>(false);

  disableAnalytics(userSubmitted = false) {
    this.analyticsEnabled$.next(false);
    this.cookiePolicyService.setAnalyticsPolicy(false, userSubmitted);
  }

  enableAnalytics(userSubmitted = false) {
    this.analyticsEnabled$.next(true);
    this.cookiePolicyService.setAnalyticsPolicy(true, userSubmitted);
  }

  initialize() {
    // Wait for user data to be available before adding GTM. Deliberately avoid using pushTag() as it
    // will try to load GTM first, which is exactly the thing we need to precede.
    combineLatest([this.analyticsEnabled$, this.userProperties$])
      .pipe(
        filter(([enabled]) => enabled),
        map((obs) => obs[1]),
        first(),
        mergeMap((user) => {
          this.tagManagerService.getDataLayer().push({ event: 'userData', ...user });
          return this.tagManagerService.addGtmToDom();
        })
      )
      .subscribe();

    // Push subsequent user changes
    combineLatest([this.analyticsEnabled$, this.userProperties$])
      .pipe(
        filter(([enabled]) => enabled),
        map((obs) => obs[1]),
        skip(1),
        mergeMap((user) => this.tagManagerService.pushTag({ event: 'userData', ...user }))
      )
      .subscribe();

    // Provide additional data for history change trigger
    combineLatest([this.analyticsEnabled$, this.router.events])
      .pipe(
        filter(([enabled]) => enabled),
        map((obs) => obs[1]),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        debounceTime(100),
        mergeMap((event) => this.tagManagerService.pushTag({ page_path: event.urlAfterRedirects }))
      )
      .subscribe();
  }
}
