import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { GDSSpacingSizes } from 'src/app/shared/types';
import { PageHeaderBanner, PageHeaderBannerService } from './page-header-banner.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent implements OnInit, OnDestroy {
  @Input() caption?: string;
  @Input() heading?: string;
  @Input() spaceAbove?: GDSSpacingSizes;
  @Input() spaceBelow?: GDSSpacingSizes = '8';

  banner?: PageHeaderBanner | null;

  private destroy$ = new Subject<void>();

  constructor(private pageHeaderBannerService: PageHeaderBannerService, private router: Router) {}

  get headerClasses() {
    return {
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    };
  }

  ngOnInit(): void {
    this.pageHeaderBannerService.banner$.pipe(takeUntil(this.destroy$)).subscribe((banner) => (this.banner = banner));
    this.router.events
      .pipe(filter((events) => events instanceof NavigationEnd))
      .subscribe(() => this.pageHeaderBannerService.clearBanner());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
