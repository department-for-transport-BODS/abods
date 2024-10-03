import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { OperatorService } from '../shared/services/operator.service';

@Injectable({
  providedIn: 'root',
})
export class OperatorGuard implements CanActivate {
  constructor(private operatorService: OperatorService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return of(route.paramMap).pipe(
      filter((paramMap) => paramMap.has('nocCode')),
      map((paramMap) => paramMap.get('nocCode') as string),
      switchMap((nocCode) => this.operatorService.fetchOperator(nocCode)),
      map((operator) => {
        if (operator) {
          return true;
        }
        return this.router.parseUrl('on-time/operator-not-found');
      })
    );
  }
}
