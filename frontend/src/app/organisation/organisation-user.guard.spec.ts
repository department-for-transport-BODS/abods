import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { UserFragment } from 'src/generated/graphql';

import { OrganisationUserGuard } from './organisation-user.guard';
import { OrganisationService } from './organisation.service';

describe('OrganisationUserGuard', () => {
  let guard: OrganisationUserGuard;
  let organisationService: OrganisationService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule, RouterTestingModule],
      providers: [
        {
          provide: OrganisationService,
          useValue: {
            fetchUser: () => of({}),
          },
        },
        {
          provide: Router,
          useValue: {
            parseUrl: () => <UrlTree>{ toString: () => '' },
          },
        },
      ],
    });
    guard = TestBed.inject(OrganisationUserGuard);
    organisationService = TestBed.inject(OrganisationService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if user is part of organisation', () => {
    spyOn(organisationService, 'fetchUser').and.returnValue(of(<UserFragment>{ email: 'test@test.con' }));

    guard
      .canActivate(<ActivatedRouteSnapshot>{ paramMap: convertToParamMap({ email: 'test@test.con' }) })
      .subscribe((value) => {
        expect(value).toBeTrue();
      });
  });

  it('should return organisation/user-not-found if user is not part of organisation', () => {
    spyOn(organisationService, 'fetchUser').and.returnValue(of(undefined));
    spyOn(router, 'parseUrl').and.returnValue(<UrlTree>{ toString: () => 'organisation/user-not-found' });

    guard
      .canActivate(<ActivatedRouteSnapshot>{ paramMap: convertToParamMap({ email: 'test@test.con' }) })
      .subscribe((value) => {
        expect(value.toString()).toEqual('organisation/user-not-found');
      });
  });
});
