import { of } from 'rxjs';
import { FreshdeskApiService, FreshdeskArticle } from './freshdesk-api.service';
import { HelpdeskDataService } from './helpdesk-data.service';
import { SpectatorService, SpyObject, createServiceFactory } from '@ngneat/spectator';

describe('HelpdeskDataService', () => {
  let spectator: SpectatorService<HelpdeskDataService>;
  let service: HelpdeskDataService;
  let freshdeskApiService: SpyObject<FreshdeskApiService>;

  const mockArticles: FreshdeskArticle[] = [
    <FreshdeskArticle>{
      title: 'Title 1',
      description: 'Description 1',
    },
  ];

  const createService = createServiceFactory({
    service: HelpdeskDataService,
    mocks: [FreshdeskApiService],
  });

  beforeEach(() => {
    spectator = createService();
    freshdeskApiService = spectator.inject(FreshdeskApiService);
    service = spectator.service;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call api service to load helpdesk data', () => {
    freshdeskApiService.getFolder.and.returnValue(of(mockArticles));
    service.loadData('otp', 'On time');

    expect(freshdeskApiService.getFolder).toHaveBeenCalledWith('otp');
  });

  it('should return loaded helpdesk data', () => {
    freshdeskApiService.getFolder.and.returnValue(of(mockArticles));

    service.loadData('otp', 'On time');

    service.getHelpdeskData().subscribe((data) => {
      expect(data?.title).toEqual('On time');
      expect(data?.articles[0].title).toEqual('Title 1');
      expect(data?.articles[0].description).toEqual('Description 1');
    });
  });
});
