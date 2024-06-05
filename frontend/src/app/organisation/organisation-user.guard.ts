import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { OrganisationService } from './organisation.service';

@Injectable({
  providedIn: 'root',
})
export class OrganisationUserGuard implements CanActivate {
  constructor(private organisationService: OrganisationService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return of(route.paramMap).pipe(
      filter((paramMap) => paramMap.has('email')),
      map((paramMap) => paramMap.get('email') as string),
      switchMap((email) => this.organisationService.fetchUser(email)),
      map((user) => {
        if (user) {
          return true;
        }
        return this.router.parseUrl('organisation/user-not-found');
      })
    );
  }
}
