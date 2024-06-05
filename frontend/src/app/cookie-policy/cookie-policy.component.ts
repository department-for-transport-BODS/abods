import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Subject, takeUntil } from 'rxjs';
import { PageHeaderBannerService } from '../layout/page-header/page-header-banner.service';
import { AnalyticsService } from '../shared/services/analytics.service';
import { CookiePolicyService } from '../shared/services/cookie-policy.service';

@Component({
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.scss'],
})
export class CookiePolicyComponent implements OnInit, AfterViewInit, OnDestroy {
  acceptCookies: 'yes' | 'no' = 'no';

  constructor(
    private analyticsService: AnalyticsService,
    private cookiePolicyService: CookiePolicyService,
    private pageHeaderBannerService: PageHeaderBannerService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.acceptCookies = this.cookiePolicyService.getAnalyticsPolicy().analyticsEnabled ? 'yes' : 'no';
  }

  ngAfterViewInit(): void {
    const isSaved$ = this.route.queryParamMap.pipe(
      map((params) => params.get('saved')),
      filter((saved) => saved === 'true'),
      takeUntil(this.destroy$)
    );
    isSaved$.subscribe(() => this.setBanner());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChange() {
    this.pageHeaderBannerService.clearBanner();
    this.router.navigate([], {
      queryParams: {
        saved: false,
      },
      queryParamsHandling: 'merge',
    });
  }

  onSave() {
    window.scroll(0, 0);
    if (this.acceptCookies === 'yes') {
      this.analyticsService.enableAnalytics(true);
    } else {
      this.analyticsService.disableAnalytics(true);
    }
    this.router
      .navigate([], {
        queryParams: {
          saved: true,
        },
        queryParamsHandling: 'merge',
      })
      .then(() => this.reloadPage());
  }

  reloadPage() {
    window.location.reload();
  }

  private setBanner() {
    this.pageHeaderBannerService.setBanner({
      title: 'Success',
      id: 'cookie-pref-saved',
      message: "You've set your cookie preferences.",
      success: true,
      dismissable: true,
      onDismiss: () => this.pageHeaderBannerService.clearBanner(),
    });
    this.cd.detectChanges();
  }
}
