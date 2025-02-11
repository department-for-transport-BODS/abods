import { Injectable } from "@angular/core";
import { DashboadEmbeddedUrlGQL } from "../../generated/graphql";
import { map, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DataMonitoringService {
  constructor(private embeddedUrlQuery: DashboadEmbeddedUrlGQL) {}

  get embeddedUrl(): Observable<string> {
    return this.embeddedUrlQuery
      .fetch({})
      .pipe(map(({ data }) => data.embeddedUrl));
  }
}
