import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { PerformanceParams, PunctualityOverview } from "../on-time.service";
import { Observable } from "rxjs";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
import { incompleteConversion } from "../../shared/incompleteReasonUtils";
import { HeadwayOverviewType } from "../../../generated/graphql";
import { Duration } from "luxon";

@Component({
  selector: "app-overview-stats",
  templateUrl: "./overview-stats.component.html",
  styleUrls: ["./overview-stats.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OverviewStatsComponent {
  @Input() showTotal = false;
  @Input() showNoData = true;
  @Input() overview?: PunctualityOverview;
  @Input() frequent = false;
  @Input() headwayOverview?: HeadwayOverviewType;
  @Input() loading = true;
  @Input() nested = false;
  @Input() params$?: Observable<PerformanceParams>;

  get onTime(): number {
    return this.overview?.onTime ?? NaN;
  }

  get late(): number {
    return this.overview?.late ?? NaN;
  }

  get early(): number {
    return this.overview?.early ?? NaN;
  }

  get completed(): number {
    return this.overview?.completed ?? NaN;
  }

  get scheduled(): number {
    return this.overview?.scheduled ?? NaN;
  }

  get noData(): number {
    return this.overview?.noData ?? NaN;
  }

  get excess(): number | undefined {
    return this.headwayOverview?.excess
      ? this.headwayOverview?.excess * 60000
      : undefined;
  }

  get incompleteSummary() {
    if (!this.overview) return [];
    const incomplete = JSON.parse(this.overview.incomplete) as Record<
      number,
      number
    >;

    return incompleteConversion(incomplete);
  }

  get averageDelay() {
    if (!this.overview?.averageDelay) {
      return "-";
    }
    const seconds = this.overview?.averageDelay;
    return "+" + Duration.fromObject({ seconds }).toFormat("mm:ss");
  }

  constructor(private helpdeskPanelService: HelpdeskPanelService) {}

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
