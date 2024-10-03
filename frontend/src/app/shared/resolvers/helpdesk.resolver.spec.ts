import { HelpdeskResolver } from './helpdesk.resolver';
import { HelpdeskDataService } from '../services/helpdesk-data.service';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { ActivatedRoute } from '@angular/router';

describe('HelpdeskResolver', () => {
  let spectator: SpectatorService<HelpdeskResolver>;
  let route: ActivatedRoute;
  let resolver: HelpdeskResolver;
  let helpdeskDataService: HelpdeskDataService;

  const createService = createServiceFactory({
    service: HelpdeskResolver,
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { helpdeskFolder: 'otp', helpdeskTitle: 'On time' } } },
      },
    ],
    mocks: [HelpdeskDataService],
  });

  beforeEach(() => {
    spectator = createService();
    route = spectator.inject(ActivatedRoute);
    helpdeskDataService = spectator.inject(HelpdeskDataService);
    resolver = spectator.service;
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should always return true', () => {
    resolver.resolve(route.snapshot).subscribe((data) => {
      expect(data).toBeTrue();
    });
  });

  it('should call loadData with helpdeskFolder and title', () => {
    resolver.resolve(route.snapshot);

    expect(helpdeskDataService.loadData).toHaveBeenCalledWith('otp', 'On time');
  });
});
