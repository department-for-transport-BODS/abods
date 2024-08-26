import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { Operator, OperatorService } from '../shared/services/operator.service';

import { OperatorGuard } from './operator.guard';

describe('OperatorGuard', () => {
  let guard: OperatorGuard;
  let operatorService: OperatorService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule, RouterTestingModule],
      providers: [
        {
          provide: OperatorService,
          useValue: {
            fetchOperator: () => of({}),
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
    guard = TestBed.inject(OperatorGuard);
    operatorService = TestBed.inject(OperatorService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if organisation can access operator', () => {
    spyOn(operatorService, 'fetchOperator').and.returnValue(
      of(<Operator>{ name: 'ABC Buses', nocCode: 'ABC', adminAreaIds: ['123'] })
    );

    guard
      .canActivate(<ActivatedRouteSnapshot>{ paramMap: convertToParamMap({ nocCode: 'ABC' }) })
      .subscribe((value) => {
        expect(value).toBeTrue();
      });
  });

  it('should return on-time/operator-not-found if organisation cannot access operator', () => {
    spyOn(operatorService, 'fetchOperator').and.returnValue(of(undefined));
    spyOn(router, 'parseUrl').and.returnValue(<UrlTree>{ toString: () => 'on-time/operator-not-found' });

    guard
      .canActivate(<ActivatedRouteSnapshot>{ paramMap: convertToParamMap({ nocCode: 'ABC' }) })
      .subscribe((value) => {
        expect(value.toString()).toEqual('on-time/operator-not-found');
      });
  });
});
