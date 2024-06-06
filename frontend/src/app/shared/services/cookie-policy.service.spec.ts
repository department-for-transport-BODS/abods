import { HttpClient } from '@angular/common/http';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { DateTime, Settings } from 'luxon';
import { CookieService } from 'ngx-cookie-service';
import { ConfigService } from '../../config/config.service';
import { CookiePolicyService, COOKIE_POLICY_NAME } from './cookie-policy.service';

describe('CookiePolicyService', () => {
  let spectator: SpectatorService<CookiePolicyService>;
  let cookieService: SpyObject<CookieService>;
  let configService: SpyObject<ConfigService>;

  const serviceFactory = createServiceFactory({
    service: CookiePolicyService,
    mocks: [CookieService, HttpClient],
    providers: [ConfigService],
  });

  beforeEach(() => {
    Settings.now = () => 1630494000000; // 2021-09-01T12:00:00
    spectator = serviceFactory();
    cookieService = spectator.inject(CookieService);
    configService = spectator.inject(ConfigService);
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should return analytics cookie policy as disabled if no cookie set', () => {
    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeFalse();
  });

  it('should return cookie policy with analyticsEnabled set to true', () => {
    cookieService.get.andReturn('{"analyticsEnabled":true,"version":1}');

    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeTrue();
  });

  it('should return cookie policy with analyticsEnabled set to false', () => {
    cookieService.get.andReturn('{"analyticsEnabled":false,"version":1}');

    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeFalse();
  });

  it('should return cookie policy with analyticsEnabled set to false if not able to parse', () => {
    cookieService.get.andReturn('error');

    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeFalse();
  });

  it('should delete all _ga cookies if disabled', () => {
    cookieService.getAll.andReturn({ _ga: 'something', _ga_1234: 'something else', not_ga: 'keep me' });
    spectator.service.setAnalyticsPolicy(false, false);

    expect(cookieService.delete).toHaveBeenCalledTimes(2);
    expect(cookieService.delete.calls.allArgs()).toEqual([['_ga'], ['_ga_1234']]);
  });

  it('should not delete all _ga cookies if enabled', () => {
    cookieService.getAll.andReturn({ _ga: 'something', _ga_1234: 'something else', not_ga: 'keep me' });
    spectator.service.setAnalyticsPolicy(true, false);

    expect(cookieService.delete).not.toHaveBeenCalled();
  });

  it('should set policy cookie for 1 year', () => {
    spectator.service.setAnalyticsPolicy(true, true);

    expect(cookieService.set).toHaveBeenCalledWith(
      COOKIE_POLICY_NAME,
      '{"analyticsEnabled":true,"version":1,"userSubmitted":true}',
      DateTime.local().plus({ year: 1 }).toJSDate(),
      '/'
    );
  });

  it('should return false if cookie policy versions do not match', () => {
    spyOn(spectator.service, 'getAnalyticsPolicy').and.returnValue({
      analyticsEnabled: true,
      version: 1,
      userSubmitted: true,
    });
    spyOnProperty(configService, 'defaultCookiePolicy').and.returnValue({
      analyticsEnabled: true,
      version: 1.1,
      userSubmitted: true,
    });

    expect(spectator.service.getCookiePolicySubmitted()).toBeFalse();
  });

  it('should return value of stored userSubmitted if cookie policy version match', () => {
    spyOn(spectator.service, 'getAnalyticsPolicy').and.returnValue({
      analyticsEnabled: true,
      version: 1,
      userSubmitted: true,
    });
    spyOnProperty(configService, 'defaultCookiePolicy').and.returnValue({
      analyticsEnabled: true,
      version: 1,
      userSubmitted: false,
    });

    expect(spectator.service.getCookiePolicySubmitted()).toBeTrue();
  });

  it('should return default cookie policy if stored version is not latest', () => {
    cookieService.get.andReturn('{"analyticsEnabled":true,"version":1,"userSubmitted":true}');
    spyOnProperty(configService, 'defaultCookiePolicy').and.returnValue({
      analyticsEnabled: false,
      version: 1.1,
      userSubmitted: false,
    });

    expect(spectator.service.getAnalyticsPolicy().version).toEqual(1.1);
    expect(spectator.service.getAnalyticsPolicy().userSubmitted).toBeFalse();
    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeFalse();
  });

  it('should return stored cookie policy if stored version is latest', () => {
    cookieService.get.andReturn('{"analyticsEnabled":true,"version":1.1,"userSubmitted":true}');
    spyOnProperty(configService, 'defaultCookiePolicy').and.returnValue({
      analyticsEnabled: false,
      version: 1.1,
      userSubmitted: false,
    });

    expect(spectator.service.getAnalyticsPolicy().version).toEqual(1.1);
    expect(spectator.service.getAnalyticsPolicy().userSubmitted).toBeTrue();
    expect(spectator.service.getAnalyticsPolicy().analyticsEnabled).toBeTrue();
  });
});
