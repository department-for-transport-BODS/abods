import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  byText,
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { CookiePolicy } from "../config/config.service";
import { LayoutModule } from "../layout/layout.module";
import { AnalyticsService } from "../shared/services/analytics.service";
import { CookiePolicyService } from "../shared/services/cookie-policy.service";
import { SharedModule } from "../shared/shared.module";
import { CookiePolicyComponent } from "./cookie-policy.component";

fdescribe("CookiePolicyComponent", () => {
  let spectator: Spectator<CookiePolicyComponent>;
  let analyticsService: SpyObject<AnalyticsService>;
  let cookiePolicyService: SpyObject<CookiePolicyService>;

  const createComponent = createComponentFactory({
    component: CookiePolicyComponent,
    mocks: [AnalyticsService, CookiePolicyService],
    imports: [
      LayoutModule,
      SharedModule,
      FormsModule,
      RouterModule.forRoot([]),
    ],
  });

  const policy: CookiePolicy = {
    analyticsEnabled: false,
    version: 1,
    userSubmitted: true,
  };

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
    analyticsService = spectator.inject(AnalyticsService);
    cookiePolicyService = spectator.inject(CookiePolicyService);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    spectator.component.reloadPage = () => {};
  });

  it("should create with policy set to rejected", async () => {
    cookiePolicyService.getAnalyticsPolicy.andReturn(policy);
    spectator.detectChanges();

    await expect(spectator.component).toBeTruthy();
    await expect(spectator.component.acceptCookies).toEqual("no");
  });

  it("should create with policy set to accepted", async () => {
    cookiePolicyService.getAnalyticsPolicy.andReturn({
      ...policy,
      analyticsEnabled: true,
    });
    spectator.detectChanges();

    await expect(spectator.component).toBeTruthy();
    await expect(spectator.component.acceptCookies).toEqual("yes");
  });

  describe("accept and reject cookies", () => {
    beforeEach(() => {
      cookiePolicyService.getAnalyticsPolicy.andReturn(policy);
      spectator.detectChanges();
    });

    it("should enable analytics if cookies accepted", () => {
      spectator.click("#radio-item-accept-cookies");
      spectator.click(byText("Save cookie settings"));
      spectator.detectChanges();

      expect(analyticsService.enableAnalytics).toHaveBeenCalledWith(true);
      expect(analyticsService.disableAnalytics).not.toHaveBeenCalledWith();
    });

    it("should disable analytics if cookies rejected", () => {
      spectator.click("#radio-item-reject-cookies");
      spectator.click(byText("Save cookie settings"));
      spectator.detectChanges();

      expect(analyticsService.disableAnalytics).toHaveBeenCalledWith(true);
      expect(analyticsService.enableAnalytics).not.toHaveBeenCalledWith();
    });
  });
});
