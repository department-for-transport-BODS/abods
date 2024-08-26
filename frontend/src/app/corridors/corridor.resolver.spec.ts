import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, ParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of, throwError } from 'rxjs';
import { Corridor, CorridorsService } from './corridors.service';
import { CorridorNotFoundView } from './corridor-not-found-view.model';

import { CorridorResolver } from './corridor.resolver';

describe('CorridorResolver', () => {
  let resolver: CorridorResolver;
  let service: CorridorsService;
  const route = <ActivatedRouteSnapshot>{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paramMap: <ParamMap>{ get: (name: string) => '123' },
  };
  const testStop1 = { stopId: 'ST012345', naptan: '012345', stopName: 'Station Road', lat: 50, lon: 0, intId: 0 };
  const testStop2 = { stopId: 'ST023456', naptan: '023456', stopName: 'High Street', lat: 51, lon: 0, intId: 1 };
  const corridor = <Corridor>{
    name: 'test corridor',
    id: 123,
    stops: [testStop1, testStop2],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ApolloTestingModule],
      providers: [CorridorsService],
    });
    resolver = TestBed.inject(CorridorResolver);
    service = TestBed.inject(CorridorsService);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should call fetchCorridorById passing corridorId', () => {
    spyOn(service, 'fetchCorridorById').and.returnValue(of(corridor));
    resolver.resolve(route);

    expect(service.fetchCorridorById).toHaveBeenCalledWith(123);
  });

  it('should return corridor', () => {
    spyOn(service, 'fetchCorridorById').and.returnValue(of(corridor));
    resolver.resolve(route).subscribe((corridor) => {
      expect(corridor).toBeTruthy();
      expect((corridor as Corridor).id).toEqual(123);
      expect((corridor as Corridor).name).toEqual('test corridor');
      expect((corridor as Corridor).stops).toEqual([testStop1, testStop2]);
    });
  });

  it('shoud return corridor not found view on error', () => {
    spyOn(service, 'fetchCorridorById').and.returnValue(throwError(() => 'error'));
    resolver.resolve(route).subscribe((corridor) => {
      expect(corridor).toBeTruthy();
      expect(corridor).toBeInstanceOf(CorridorNotFoundView);
    });
  });
});
