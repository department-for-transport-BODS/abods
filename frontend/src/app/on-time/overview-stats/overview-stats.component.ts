import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PerformanceParams, PunctualityOverview } from '../on-time.service';
import { Headway } from '../headway.service';
import { Observable } from 'rxjs';
import { HelpdeskPanelService } from '../../shared/components/helpdesk-panel/helpdesk-panel.service';

@Component({
  selector: 'app-overview-stats',
  templateUrl: './overview-stats.component.html',
  styleUrls: ['./overview-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewStatsComponent {
  @Input() showTotal = false;
  @Input() showNoData = true;
  @Input() overview?: PunctualityOverview;
  @Input() frequent = false;
  @Input() headwayOverview?: Headway;
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

  get excess(): number {
    return (this.headwayOverview?.excess || 0) * 60000;
  }

  constructor(private helpdeskPanelService: HelpdeskPanelService) {}

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
