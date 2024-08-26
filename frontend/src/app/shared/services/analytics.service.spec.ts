import { fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SpectatorService, createServiceFactory, SpyObject } from '@ngneat/spectator';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { UserFragment } from '../../../generated/graphql';
import { AuthenticatedUserService } from '../../authentication/authenticated-user.service';
import { AnalyticsService } from './analytics.service';
import { CookiePolicyService } from './cookie-policy.service';

describe('AnalyticsService', () => {
  let spectator: SpectatorService<AnalyticsService>;
  let service: AnalyticsService;
  let tagManagerService: SpyObject<GoogleTagManagerService>;
  let authenticatedUserService: SpyObject<AuthenticatedUserService>;
  let router: SpyObject<Router>;

  const mockCookiePolicyServiceEnabled = {
    getAnalyticsPolicy: () => ({
      analyticsEnabled: true,
      version: 1,
      userSubmitted: false,
    }),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setAnalyticsPolicy: () => {},
  };
  const mockCookiePolicyServiceDisabled = {
    getAnalyticsPolicy: () => ({
      analyticsEnabled: false,
      version: 1,
      userSubmitted: false,
    }),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setAnalyticsPolicy: () => {},
  };
  const testUser1 = <UserFragment>{ id: 'user-id-1', organisation: { id: 'org-id-1', name: 'org-name-1' } };
  const testUser2 = <UserFragment>{ id: 'user-id-2', organisation: { id: 'org-id-2', name: 'org-name-2' } };
  const testUserSubject$ = new BehaviorSubject(testUser1);

  describe('enabled', () => {
    const serviceFactory = createServiceFactory({
      service: AnalyticsService,
      imports: [RouterTestingModule],
      providers: [
        MockProvider(CookiePolicyService, mockCookiePolicyServiceEnabled),
        MockProvider(GoogleTagManagerService, {
          getDataLayer: () => [],
          addGtmToDom: () => firstValueFrom(of(true)),
          pushTag: () =>
            new Promise((resolve) => {
              resolve();
            }),
        }),
      ],
    });

    beforeEach(() => {
      spectator = serviceFactory();
      spectator.inject(AnalyticsService);
      tagManagerService = spectator.inject(GoogleTagManagerService);
      authenticatedUserService = spectator.inject(AuthenticatedUserService);
      router = spectator.inject(Router);
      service = spectator.service;
    });

    it('should enable analytics if cookie policy accepted', () => {
      expect(service['analyticsEnabled$'].value).toBeTrue();
    });

    it('should add user data to tag manager service ', () => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(of(testUser1));

      service.initialize();

      expect(tagManagerService.getDataLayer).toHaveBeenCalledWith();
      expect(tagManagerService.addGtmToDom).toHaveBeenCalledOnceWith();
      expect(tagManagerService.getDataLayer()[0]).toEqual({
        event: 'userData',
        abodUserId: testUser1.id,
        abodOrgId: testUser1.organisation?.id,
        abodOrgName: testUser1.organisation?.name,
      });
    });

    it('should push subsequent user changes to tag manager service', () => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(testUserSubject$);

      service.initialize();

      testUserSubject$.next(testUser2);

      expect(tagManagerService.addGtmToDom).toHaveBeenCalledOnceWith();
      expect(tagManagerService.pushTag).toHaveBeenCalledOnceWith({
        event: 'userData',
        abodUserId: testUser2.id,
        abodOrgId: testUser2.organisation?.id,
        abodOrgName: testUser2.organisation?.name,
      });
    });

    it('should push urlAfterRedirects to tag manager service on navigation end event', fakeAsync(() => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(testUserSubject$);
      spyOnProperty(router, 'events').and.returnValue(of(new NavigationEnd(1, '/test', '/test')));

      service.initialize();
      tick(100);

      expect(tagManagerService.pushTag).toHaveBeenCalledWith({ page_path: '/test' });
    }));
  });

  describe('disabled', () => {
    const serviceFactory = createServiceFactory({
      service: AnalyticsService,
      imports: [RouterTestingModule],
      providers: [
        MockProvider(CookiePolicyService, mockCookiePolicyServiceDisabled),
        MockProvider(GoogleTagManagerService, {
          getDataLayer: () => [],
          addGtmToDom: () => firstValueFrom(of(true)),
          pushTag: () =>
            new Promise((resolve) => {
              resolve();
            }),
        }),
      ],
    });

    beforeEach(() => {
      spectator = serviceFactory();
      spectator.inject(AnalyticsService);
      tagManagerService = spectator.inject(GoogleTagManagerService);
      authenticatedUserService = spectator.inject(AuthenticatedUserService);
      router = spectator.inject(Router);
      service = spectator.service;
    });

    it('should disable analytics if cookie policy rejected', () => {
      expect(service['analyticsEnabled$'].value).toBeFalse();
    });

    it('should not add user data to tag manager service ', () => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(of(testUser1));

      service.initialize();

      expect(tagManagerService.getDataLayer).not.toHaveBeenCalled();
      expect(tagManagerService.addGtmToDom).not.toHaveBeenCalled();
    });

    it('should not push subsequent user changes to tag manager service', () => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(testUserSubject$);

      service.initialize();

      testUserSubject$.next(testUser2);

      expect(tagManagerService.addGtmToDom).not.toHaveBeenCalled();
      expect(tagManagerService.pushTag).not.toHaveBeenCalled();
    });

    it('should not push urlAfterRedirects to tag manager service on navigation end event', fakeAsync(() => {
      spyOn(tagManagerService, 'getDataLayer').and.returnValue([]);
      spyOn(tagManagerService, 'pushTag').and.returnValue(firstValueFrom(of([])));
      spyOn(tagManagerService, 'addGtmToDom').and.returnValue(firstValueFrom(of(true)));
      spyOnProperty(authenticatedUserService, 'authenticatedUser$').and.returnValue(testUserSubject$);
      spyOnProperty(router, 'events').and.returnValue(of(new NavigationEnd(1, '/test', '/test')));

      service.initialize();
      tick(100);

      expect(tagManagerService.pushTag).not.toHaveBeenCalled();
    }));
  });
});
