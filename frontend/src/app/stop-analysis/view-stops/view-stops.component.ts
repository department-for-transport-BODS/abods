import { Component } from "@angular/core";
import { StopAnalysisListGQL } from "../../../generated/graphql";
import { PerformanceParams } from "../../on-time/on-time.service";
import { ReplaySubject } from "rxjs";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent {
  constructor(private stopAnalysisQuery: StopAnalysisListGQL) {}

  params$ = new ReplaySubject<PerformanceParams>();

  // stopData(): Observable<StopAnalysisType[]> {
  //   return this.stopAnalysisQuery
  //     .fetch({})
  //     .pipe(map(({ data }) => data?.stopAnalysis as StopAnalysisType[]));
  // }
}
