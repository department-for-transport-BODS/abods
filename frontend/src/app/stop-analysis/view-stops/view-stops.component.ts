import { Component } from "@angular/core";
import { PerformanceParams } from "../../on-time/on-time.service";
import { ReplaySubject } from "rxjs";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent {
  params$ = new ReplaySubject<PerformanceParams>();
}
