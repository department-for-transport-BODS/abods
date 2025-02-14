import { Injectable } from "@angular/core";
import {
  AwsQuicksightUser,
  DashboadEmbeddedUrlGQL,
  DashboardUserGQL,
} from "../../generated/graphql";
import { map, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DataMonitoringService {
  constructor(
    private embeddedUrlQuery: DashboadEmbeddedUrlGQL,
    private dashboardUserQuery: DashboardUserGQL,
  ) {}

  get embeddedUrl(): Observable<AwsQuicksightUser> {
    return this.embeddedUrlQuery
      .fetch({})
      .pipe(map(({ data }) => data.embeddedUrl));
  }

  get dashboardUser(): Observable<AwsQuicksightUser> {
    return this.dashboardUserQuery
      .fetch({})
      .pipe(map(({ data }) => data.quicksightUser));
  }
}
