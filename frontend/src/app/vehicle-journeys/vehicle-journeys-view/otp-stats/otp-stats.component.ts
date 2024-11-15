import { Component, Input } from "@angular/core";

import { VehiclePingStop } from "../vehicle-ping-stop.model";
import { OtpEnum } from "../../../../generated/graphql";

@Component({
  selector: "app-otp-stats",
  templateUrl: "./otp-stats.component.html",
  styleUrls: ["./otp-stats.component.scss"],
})
export class OtpStatsComponent {
  @Input() stopList?: VehiclePingStop[];
  @Input() loading?: boolean;
  @Input() estimated?: boolean;
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

    const filtered = this.stopList
      .filter((stop) => stop.isTimingPoint || !this.timingPointsOnly)
      .map((n) => (this.estimated ? n.otp ?? n.otpEstimate : n.otp));

    const total = filtered.length;
    const early = filtered.filter((n) => n === OtpEnum.Early).length;
    const onTime = filtered.filter((n) => n === OtpEnum.OnTime).length;
    const late = filtered.filter((n) => n === OtpEnum.Late).length;
    const noData = filtered.filter((n) => n === null).length;
    const completed = total - noData;
    return { total, early, onTime, late, noData, completed };
  }
}
