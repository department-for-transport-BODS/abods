import { Component, Input } from "@angular/core";
import { OperatorDashboardFragment } from "src/generated/graphql";

@Component({
  selector: "app-feed-status-summary",
  templateUrl: "./feed-status-summary.component.html",
  styleUrls: ["./feed-status-summary.component.scss"],
  standalone: false,
})
export class FeedStatusSummaryComponent {
  @Input() operators: OperatorDashboardFragment[] = [];
}
