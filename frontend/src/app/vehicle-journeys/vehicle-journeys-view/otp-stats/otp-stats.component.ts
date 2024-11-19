import { Component, Input } from "@angular/core";
import { OtpEnum } from "../../../../generated/graphql";
import { StopDetails } from "../vehicle-journeys-view.component";

@Component({
  selector: "app-otp-stats",
  templateUrl: "./otp-stats.component.html",
  styleUrls: ["./otp-stats.component.scss"],
})
export class OtpStatsComponent {
  @Input() stopList?: StopDetails[];
  @Input() loading?: boolean;
  @Input() timingPointsOnly?: boolean;

  get calculated() {
    if (!this.stopList)
      return {
        total: NaN,
        early: NaN,
        onTime: NaN,
        late: NaN,
        noData: NaN,
        completed: NaN,
      };

    const filtered = this.stopList.filter(
      (stop) => stop.isTimingPoint || !this.timingPointsOnly,
    );

    const total = filtered.length;
    const early = filtered.filter((n) => n.otp === OtpEnum.Early).length;
    const onTime = filtered.filter((n) => n.otp === OtpEnum.OnTime).length;
    const late = filtered.filter((n) => n.otp === OtpEnum.Late).length;
    const noData = filtered.filter((n) => n.otp === null).length;
    const completed = total - noData;
    return { total, early, onTime, late, noData, completed };
  }
}
