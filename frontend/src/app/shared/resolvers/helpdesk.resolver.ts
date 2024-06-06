import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HelpdeskDataService } from '../services/helpdesk-data.service';

@Injectable({
  providedIn: 'root',
})
export class HelpdeskResolver implements Resolve<boolean> {
  constructor(private helpdeskDataService: HelpdeskDataService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    this.helpdeskDataService.loadData(route.data.helpdeskFolder, route.data.helpdeskTitle);
    return of(true);
  }
}
