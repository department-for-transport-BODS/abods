import { Injectable } from "@angular/core";
import {
  AwsQuicksightUser,
  DashboadEmbeddedUrlGQL,
} from "../../generated/graphql";
import { map, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DataMonitoringService {
  constructor(private embeddedUrlQuery: DashboadEmbeddedUrlGQL) {}

  embeddedUrl(): Observable<AwsQuicksightUser> {
    return this.embeddedUrlQuery
      .fetch({})
      .pipe(map(({ data }) => data.embeddedUrl));
  }
}
