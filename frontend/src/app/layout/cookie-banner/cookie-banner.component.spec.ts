import { byText, byTextContent, createComponentFactory, Spectator, SpyObject } from '@ngneat/spectator';
import { MockProvider } from 'ng-mocks';
import { AnalyticsService } from '../../shared/services/analytics.service';
import { CookiePolicyService } from '../../shared/services/cookie-policy.service';
import { SharedModule } from '../../shared/shared.module';

import { CookieBannerComponent } from './cookie-banner.component';

describe('CookieBannerComponent', () => {
  let spectator: Spectator<CookieBannerComponent>;
  let cookiePolicyService: SpyObject<CookiePolicyService>;

  const mockCookiePolicyServiceSubmitted = {
    getCookiePolicySubmitted: () => true,
  };
  const mockCookiePolicyServiceUnsubmitted = {
    getCookiePolicySubmitted: () => false,
  };

  describe('submitted', () => {
    const createComponent = createComponentFactory({
      component: CookieBannerComponent,
      mocks: [AnalyticsService],
      providers: [MockProvider(CookiePolicyService, mockCookiePolicyServiceSubmitted)],
    });

    beforeEach(() => {
      spectator = createComponent();
    });

    it('should not be visible if user has submitted their decision', () => {
      expect(spectator.query('.govuk-cookie-banner')).not.toBeVisible();
    });
  });

  describe('unsubmitted', () => {
    const createComponent = createComponentFactory({
      component: CookieBannerComponent,
      imports: [SharedModule],
      mocks: [AnalyticsService],
      providers: [MockProvider(CookiePolicyService, mockCookiePolicyServiceUnsubmitted)],
    });

    beforeEach(() => {
      spectator = createComponent();
      cookiePolicyService = spectator.inject(CookiePolicyService);
    });

    it('should be visible if user has not submitted their decision', () => {
      expect(spectator.query('.govuk-cookie-banner')).toBeVisible();
    });

    it('should show cookie banner with accept and reject buttons if not submitted', () => {
      expect(spectator.query(byText('We use some essential cookies to make this service work.'))).toBeVisible();
      expect(spectator.query(byText('Accept analytics cookies'))).toBeVisible();
      expect(spectator.query(byText('Reject analytics cookies'))).toBeVisible();
    });

    it('should notify user has accepted analytics cookies', () => {
      spyOn(cookiePolicyService, 'getAnalyticsPolicy').and.returnValue({ analyticsEnabled: true });
      spectator.click(byText('Accept analytics cookies'));
      spectator.detectChanges();

      expect(
        spectator.query(
          byTextContent('You’ve accepted analytics cookies. You can change your cookie settings at any time.', {
            selector: 'p',
          })
        )
      ).toBeVisible();

      expect(spectator.query(byText('Hide cookie message'))).toBeVisible();
      expect(spectator.query(byText('We use some essential cookies to make this service work.'))).not.toBeVisible();
      expect(spectator.query(byText('Accept analytics cookies'))).not.toBeVisible();
      expect(spectator.query(byText('Reject analytics cookies'))).not.toBeVisible();
    });

    it('should notify user has rejected analytics cookies', () => {
      spyOn(cookiePolicyService, 'getAnalyticsPolicy').and.returnValue({ analyticsEnabled: false });
      spectator.click(byText('Reject analytics cookies'));
      spectator.detectChanges();

      expect(
        spectator.query(
          byTextContent('You’ve rejected analytics cookies. You can change your cookie settings at any time.', {
            selector: 'p',
          })
        )
      ).toBeVisible();

      expect(spectator.query(byText('Hide cookie message'))).toBeVisible();
      expect(spectator.query(byText('We use some essential cookies to make this service work.'))).not.toBeVisible();
      expect(spectator.query(byText('Accept analytics cookies'))).not.toBeVisible();
      expect(spectator.query(byText('Reject analytics cookies'))).not.toBeVisible();
    });

    it('should hide notification banner', () => {
      spyOn(cookiePolicyService, 'getAnalyticsPolicy').and.returnValue({ analyticsEnabled: false });
      spectator.click(byText('Reject analytics cookies'));
      spectator.detectChanges();

      expect(
        spectator.query(
          byTextContent('You’ve rejected analytics cookies. You can change your cookie settings at any time.', {
            selector: 'p',
          })
        )
      ).toBeVisible();

      expect(spectator.query(byText('Hide cookie message'))).toBeVisible();

      spectator.click(byText('Hide cookie message'));
      spectator.detectChanges();

      expect(spectator.query('.govuk-cookie-banner')).not.toBeVisible();
    });
  });
});
