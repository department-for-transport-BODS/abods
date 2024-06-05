import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, Observable, of } from 'rxjs';
import { Corridor, CorridorsService } from './corridors.service';
import { CorridorNotFoundView } from './corridor-not-found-view.model';

@Injectable({
  providedIn: 'root',
})
export class CorridorResolver implements Resolve<Observable<Corridor | CorridorNotFoundView>> {
  constructor(private corridorsService: CorridorsService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Corridor | CorridorNotFoundView> {
    const corridorId = Number(route.paramMap.get('corridorId'));
    return this.corridorsService.fetchCorridorById(corridorId).pipe(catchError(() => of(new CorridorNotFoundView())));
  }
}
