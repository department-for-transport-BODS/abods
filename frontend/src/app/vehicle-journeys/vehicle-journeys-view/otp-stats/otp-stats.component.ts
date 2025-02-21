import { Component, Input } from "@angular/core";
import { MatchType, OtpEnum } from "../../../../generated/graphql";
import { JourneyInfo } from "../vehicle-journeys-view.component";
import { incompleteConversion } from "../../../shared/incompleteReasonUtils";

@Component({
  selector: "app-otp-stats",
  templateUrl: "./otp-stats.component.html",
  styleUrls: ["./otp-stats.component.scss"],
})
export class OtpStatsComponent {
  @Input() view: JourneyInfo | null = null;
  @Input() timingPointsOnly?: boolean;
  @Input() matchType = MatchType.Evidenced;

  get calculated() {
    if (!this.view?.stops)
      return {
        total: NaN,
        early: NaN,
        onTime: NaN,
        late: NaN,
        noData: NaN,
        completed: NaN,
        incomplete: [],
      };

    const stopDetails = this.view.stops
      .filter((stop) => stop.isTimingPoint || !this.timingPointsOnly)
      .map((n) => ({
        otp:
          this.matchType === MatchType.Evidenced && n.estimatedDepartureUtc
            ? null
            : n.otp,
        incompleteReason: n.incompleteReason ?? 0,
      }));

    const total = stopDetails.length;
    const early = stopDetails.filter((n) => n.otp === OtpEnum.Early).length;
    const onTime = stopDetails.filter((n) => n.otp === OtpEnum.OnTime).length;
    const late = stopDetails.filter((n) => n.otp === OtpEnum.Late).length;
    const noMatchStops = stopDetails.filter((n) => n.otp === null);

    const reasonCounts: Record<number, number> = {};
    for (const { incompleteReason } of noMatchStops) {
      reasonCounts[incompleteReason] ??= 0;
      reasonCounts[incompleteReason] += 1;
    }
    const incomplete = incompleteConversion(reasonCounts);
    const noData = noMatchStops.length;
    const completed = total - noData;
    return { total, early, onTime, late, noData, completed, incomplete };
  }
}
