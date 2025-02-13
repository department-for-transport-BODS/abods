import { Component, Input } from "@angular/core";
import { MatchType, OtpEnum } from "../../../../generated/graphql";
import { JourneyInfo } from "../vehicle-journeys-view.component";
import { incompleteTally } from "../../../shared/incompleteReasonUtils";

@Component({
  selector: "app-otp-stats",
  templateUrl: "./otp-stats.component.html",
  styleUrls: ["./otp-stats.component.scss"],
})
export class OtpStatsComponent {
  @Input() view: JourneyInfo | null = null;
  @Input() loading?: boolean;
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
        incomplete: incompleteTally([]),
      };

    const otpEnums = this.view.stops
      .filter((stop) => stop.isTimingPoint || !this.timingPointsOnly)
      .map((n) => ({
        otp:
          this.matchType === MatchType.Evidenced && n.estimatedDepartureUtc
            ? null
            : n.otp,
        incompleteReason: n.incompleteReason,
      }));

    const total = otpEnums.length;
    const early = otpEnums.filter((n) => n.otp === OtpEnum.Early).length;
    const onTime = otpEnums.filter((n) => n.otp === OtpEnum.OnTime).length;
    const late = otpEnums.filter((n) => n.otp === OtpEnum.Late).length;
    const noMatchStops = otpEnums.filter((n) => n.otp === null);

    const incomplete = incompleteTally(
      noMatchStops.map((n) => n.incompleteReason ?? null),
    );
    const noData = noMatchStops.length;
    const completed = total - noData;
    return { total, early, onTime, late, noData, completed, incomplete };
  }

  get incompleteSummary() {
    return Object.entries(this.calculated.incomplete)
      .filter((n) => n[1])
      .map(([reason, count]) => ({ reason, count }));
  }
}
