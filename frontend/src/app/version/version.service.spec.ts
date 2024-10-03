import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApolloQueryResult } from '@apollo/client';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of, throwError } from 'rxjs';
import { GetVersionGQL, GetVersionQuery } from '../../generated/graphql';

import { Version, VersionService } from './version.service';

describe('VersionService', () => {
  let service: VersionService;
  let http: HttpClient;
  let versionGQL: GetVersionGQL;

  const mockFrontEndResponse = { version: 'v1.7.0', buildNumber: '11111' };
  const mockApiResponse = <ApolloQueryResult<GetVersionQuery>>{
    data: { apiInfo: { version: 'v1.9.0', buildNumber: '22222' } },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ApolloTestingModule],
      providers: [
        {
          provide: HttpClient,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            get: (url: string, options?: any) => of(),
          },
        },
        {
          provide: GetVersionGQL,
          useValue: {
            fetch: () => of({}),
          },
        },
      ],
    });
    service = TestBed.inject(VersionService);
    http = TestBed.inject(HttpClient);
    versionGQL = TestBed.inject(GetVersionGQL);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('printTable', () => {
    it('should call console.table with version numbers', () => {
      spyOn(http, 'get').and.returnValue(of(mockFrontEndResponse));
      spyOn(versionGQL, 'fetch').and.returnValue(of(mockApiResponse));
      spyOn(console, 'table');
      service.printVersion();

      expect(console.table).toHaveBeenCalledWith({
        FE: Version.create(mockFrontEndResponse),
        API: Version.create(mockApiResponse.data.apiInfo),
        DWH: Version.createUnknown(),
      });
    });

    it('should call console.table with unknown on error', () => {
      spyOn(http, 'get').and.returnValue(throwError(() => new Error()));
      spyOn(versionGQL, 'fetch').and.returnValue(throwError(() => new Error()));
      spyOn(console, 'table');
      service.printVersion();

      expect(console.table).toHaveBeenCalledWith({
        FE: Version.createUnknown(),
        API: Version.createUnknown(),
        DWH: Version.createUnknown(),
      });
    });
  });
});
