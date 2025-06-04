import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, UrlTree } from "@angular/router";
import { filter, map, Observable, of, switchMap } from "rxjs";
import { OrganisationService } from "./organisation.service";

@Injectable({
  providedIn: "root",
})
export class OrganisationUserGuard {
  constructor(
    private organisationService: OrganisationService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return of(route.paramMap).pipe(
      filter((paramMap) => paramMap.has("email")),
      map((paramMap) => paramMap.get("email")!),
      switchMap((email) => this.organisationService.fetchUser(email)),
      map((user) => {
        if (user) {
          return true;
        }
        return this.router.parseUrl("organisation/user-not-found");
      }),
    );
  }
}
