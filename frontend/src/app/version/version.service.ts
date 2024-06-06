import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, zip } from 'rxjs';
import { GetVersionGQL } from '../../generated/graphql';

interface IVersion {
  version: string;
  buildNumber: string;
}

export class Version implements IVersion {
  version!: string;
  buildNumber!: string;

  static createUnknown() {
    const v = new Version();
    v.version = 'unknown';
    v.buildNumber = 'unknown';
    return v;
  }

  static create(i: IVersion) {
    const v = new Version();
    v.version = i.version;
    v.buildNumber = i.buildNumber;
    return v;
  }
}

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  constructor(private http: HttpClient, private versionGQL: GetVersionGQL) {}

  printVersion() {
    const frontEndVersion$ = this.getFrontEndVersion();
    const apiVersion$ = this.getApiVersion();
    const dwhVersion$ = this.getDwhVersion();

    zip(frontEndVersion$, apiVersion$, dwhVersion$).subscribe(([frontEndVersion, apiVersion, dwhVersion]) => {
      console.table({
        FE: frontEndVersion,
        API: apiVersion,
        DWH: dwhVersion,
      });
    });
  }

  getFrontEndVersion(): Observable<Version> {
    return this.http
      .get<IVersion>('./version.json', { responseType: 'json' })
      .pipe(
        map((data) => Version.create(data)),
        catchError(() => of(Version.createUnknown()))
      );
  }

  getApiVersion(): Observable<Version> {
    return this.versionGQL.fetch().pipe(
      map(({ data }) => Version.create(data.apiInfo)),
      catchError(() => of(Version.createUnknown()))
    );
  }

  getDwhVersion() {
    // TODO implement when available from API
    return of(Version.createUnknown());
  }
}
