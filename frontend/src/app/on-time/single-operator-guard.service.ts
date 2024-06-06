import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { OperatorService } from '../shared/services/operator.service';

@Injectable({
  providedIn: 'root',
})
export class SingleOperatorGuardService implements CanActivate {
  constructor(private operatorService: OperatorService, private router: Router) {}

  canActivate() {
    return this.operatorService
      .fetchOperators()
      .pipe(map((list) => (list.length === 1 ? this.router.createUrlTree(['on-time', list[0].nocCode]) : true)));
  }
}
