import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { CookieService } from 'ngx-cookie-service';
import { ConfigService, CookiePolicy } from '../../config/config.service';

export const COOKIE_POLICY_NAME = 'abod_cookies_policy';

@Injectable({
  providedIn: 'root',
})
export class CookiePolicyService {
  constructor(private cookieService: CookieService, private configService: ConfigService) {}

  getAnalyticsPolicy(): CookiePolicy {
    try {
      const storedPolicy: CookiePolicy = JSON.parse(this.cookieService.get(COOKIE_POLICY_NAME));
      if (storedPolicy && this.isLatestVersion(storedPolicy)) {
        return storedPolicy;
      } else {
        return this.configService.defaultCookiePolicy;
      }
    } catch {
      // Return disabled as default if no policy cookie set
      return this.configService.defaultCookiePolicy;
    }
  }

  setAnalyticsPolicy(enabled: boolean, userSubmitted: boolean) {
    if (!enabled) {
      const cookies = this.cookieService.getAll();
      for (const name in cookies) {
        // Remove all GA cookies
        if (name.startsWith('_ga')) {
          this.cookieService.delete(name);
        }
      }
    }
    if (userSubmitted) {
      const cookie: CookiePolicy = {
        analyticsEnabled: enabled,
        version: this.configService.defaultCookiePolicy.version,
        userSubmitted: true,
      };
      this.cookieService.set(
        COOKIE_POLICY_NAME,
        JSON.stringify(cookie),
        DateTime.local().plus({ year: 1 }).toJSDate(),
        '/'
      );
    }
  }

  getCookiePolicySubmitted(): boolean {
    const storedPolicy = this.getAnalyticsPolicy();
    // If the cookie policy version has been updated then user must accept or reject again
    if (!this.isLatestVersion(storedPolicy)) {
      return false;
    } else {
      return storedPolicy.userSubmitted;
    }
  }

  private isLatestVersion(storedPolicy: CookiePolicy): boolean {
    return this.configService.defaultCookiePolicy.version === storedPolicy.version;
  }
}
