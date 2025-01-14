import { Component } from "@angular/core";
import {
  StopAnalysisListGQL,
  StopAnalysisType,
} from "../../../generated/graphql";
import { map } from "rxjs";
import { Observable } from "@apollo/client";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent {
  constructor(private stopAnalysisQuery: StopAnalysisListGQL) {}

  // stopData(): Observable<StopAnalysisType[]> {
  //   return this.stopAnalysisQuery
  //     .fetch({})
  //     .pipe(map(({ data }) => data?.stopAnalysis as StopAnalysisType[]));
  // }
}
