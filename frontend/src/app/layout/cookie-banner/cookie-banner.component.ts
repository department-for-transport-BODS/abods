import { Component } from '@angular/core';
import { AnalyticsService } from '../../shared/services/analytics.service';
import { CookiePolicyService } from '../../shared/services/cookie-policy.service';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.scss'],
})
export class CookieBannerComponent {
  hidden = false;
  submitted = false;

  get analyticsEnabled(): boolean {
    return this.cookiePolicyService.getAnalyticsPolicy().analyticsEnabled;
  }

  constructor(private analyticsService: AnalyticsService, private cookiePolicyService: CookiePolicyService) {
    this.hidden = this.cookiePolicyService.getCookiePolicySubmitted();
  }

  onAccept() {
    this.analyticsService.enableAnalytics(true);
    this.submitted = true;
  }

  onReject() {
    this.analyticsService.disableAnalytics(true);
    this.submitted = true;
  }

  onHide() {
    this.hidden = true;
  }
}
