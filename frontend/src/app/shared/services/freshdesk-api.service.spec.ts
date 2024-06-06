import { of, throwError } from 'rxjs';
import { ConfigService, FreshdeskConfig } from '../../config/config.service';
import { FreshdeskApiService, FreshdeskArticle, FreshdeskArticleStatus } from './freshdesk-api.service';
import { HttpMethod, SpectatorHttp, createHttpFactory } from '@ngneat/spectator';

describe('FreshdeskApiService', () => {
  let spectator: SpectatorHttp<FreshdeskApiService>;
  let service: FreshdeskApiService;

  const mockConfig: FreshdeskConfig = {
    apiUrl: 'testurl/',
    folders: {
      dashboard: '43000590034',
      feedMonitoring: '43000590035',
      otp: '43000590033',
      vehicleJourneys: '43000590036',
      corridors: '43000590037',
      organisation: '43000590076',
    },
  };

  const mockArticles: FreshdeskArticle[] = [
    <FreshdeskArticle>{
      status: FreshdeskArticleStatus.PUBLISHED,
      title: 'Published 1',
    },
    <FreshdeskArticle>{
      status: FreshdeskArticleStatus.PUBLISHED,
      title: 'Published 2',
    },
    <FreshdeskArticle>{
      status: FreshdeskArticleStatus.DRAFT,
      title: 'Draft 1',
    },
    <FreshdeskArticle>{
      status: FreshdeskArticleStatus.DRAFT,
      title: 'Draft 2',
    },
  ];

  const createHttp = createHttpFactory({
    service: FreshdeskApiService,
    providers: [
      {
        provide: ConfigService,
        useValue: {
          get freshdeskConfig() {
            return mockConfig;
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    service = spectator.service;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make request to helpdesk api', () => {
    service.getFolder('otp').subscribe();

    spectator.expectOne('testurl/43000590033', HttpMethod.GET);
  });

  it('should return an empty array on error', () => {
    spyOn(spectator.httpClient, 'get').and.returnValue(throwError(() => 'error'));

    service.getFolder('otp').subscribe((data) => {
      expect(data.length).toEqual(0);
    });
  });

  it('should filter out draft articles', () => {
    spyOn(spectator.httpClient, 'get').and.returnValue(of(mockArticles));

    service.getFolder('otp').subscribe((data) => {
      data.forEach((article) => {
        expect(article.status).toEqual(FreshdeskArticleStatus.PUBLISHED);
      });

      expect(data.length).toEqual(2);
    });
  });

  it('should not make a request to helpdesk api if folder passed is empty string', () => {
    spyOn(spectator.httpClient, 'get').and.returnValue(of(mockArticles));

    service.getFolder('').subscribe((data) => {
      expect(data).toEqual([]);
    });

    expect(spectator.httpClient.get).not.toHaveBeenCalled();
  });
});
