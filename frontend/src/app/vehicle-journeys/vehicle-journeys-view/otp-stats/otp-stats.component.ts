import { Component, Input } from "@angular/core";
import { MatchType, OtpEnum } from "../../../../generated/graphql";
import { JourneyInfo } from "../vehicle-journeys-view.component";

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
      };

    const otpEnums = this.view.stops
      .filter((stop) => stop.isTimingPoint || !this.timingPointsOnly)
      .map((n) =>
        this.matchType === MatchType.Evidenced && n.estimatedDepartureUtc
          ? null
          : n.otp,
      );

    const total = otpEnums.length;
    const early = otpEnums.filter((n) => n === OtpEnum.Early).length;
    const onTime = otpEnums.filter((n) => n === OtpEnum.OnTime).length;
    const late = otpEnums.filter((n) => n === OtpEnum.Late).length;
    const noData = otpEnums.filter((n) => n === null).length;
    const completed = total - noData;
    return { total, early, onTime, late, noData, completed };
  }
}
