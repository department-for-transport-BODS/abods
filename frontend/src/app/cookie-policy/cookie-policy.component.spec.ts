import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { byText, createComponentFactory, Spectator, SpyObject } from '@ngneat/spectator';
import { LayoutModule } from '../layout/layout.module';
import { AnalyticsService } from '../shared/services/analytics.service';
import { CookiePolicyService } from '../shared/services/cookie-policy.service';
import { SharedModule } from '../shared/shared.module';

import { CookiePolicyComponent } from './cookie-policy.component';

describe('CookiePolicyComponent', () => {
  let spectator: Spectator<CookiePolicyComponent>;
  let analyticsService: SpyObject<AnalyticsService>;
  let cookiePolicyService: SpyObject<CookiePolicyService>;

  const createComponent = createComponentFactory({
    component: CookiePolicyComponent,
    mocks: [AnalyticsService, CookiePolicyService],
    imports: [LayoutModule, SharedModule, FormsModule, RouterTestingModule],
  });

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
    analyticsService = spectator.inject(AnalyticsService);
    cookiePolicyService = spectator.inject(CookiePolicyService);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    spectator.component.reloadPage = () => {};
  });

  it('should create with policy set to rejected', () => {
    cookiePolicyService.getAnalyticsPolicy.andReturn({ analyticsEnabled: false, version: 1 });
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
    expect(spectator.component.acceptCookies).toEqual('no');
  });

  it('should create with policy set to accepted', () => {
    cookiePolicyService.getAnalyticsPolicy.andReturn({ analyticsEnabled: true, version: 1 });
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
    expect(spectator.component.acceptCookies).toEqual('yes');
  });

  describe('accept and reject cookies', () => {
    beforeEach(() => {
      cookiePolicyService.getAnalyticsPolicy.andReturn({ analyticsEnabled: true, version: 1 });
      spectator.detectChanges();
    });

    it('should enable analytics if cookies accepted', () => {
      spectator.click('#radio-item-accept-cookies');
      spectator.click(byText('Save cookie settings'));
      spectator.detectChanges();

      expect(analyticsService.enableAnalytics).toHaveBeenCalledWith(true);
      expect(analyticsService.disableAnalytics).not.toHaveBeenCalledWith();
    });

    it('should disable analytics if cookies rejected', () => {
      spectator.click('#radio-item-reject-cookies');
      spectator.click(byText('Save cookie settings'));
      spectator.detectChanges();

      expect(analyticsService.disableAnalytics).toHaveBeenCalledWith(true);
      expect(analyticsService.enableAnalytics).not.toHaveBeenCalledWith();
    });
  });
});
