import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { PerformanceFiltersInputType } from "src/generated/graphql";
import { isEqual as _isEqual } from "lodash-es";
import { PerformanceParams } from "../on-time.service";
import { DateRangeService } from "../../shared/services/date-range.service";
import { ifNullOrUndefinedReturnEmptyString } from "../../shared/rxjs-operators";
import { OnTimePanelService } from "./on-time-panel.service";
import { PanelService } from "../../shared/components/panel/panel.service";
import { ControlsComponent } from "../../shared/components/controls/controls.component";

export type TimingPoints = "all-stops" | "timing-points";

@Component({
  selector: "app-on-time-controls",
  templateUrl: "on-time-controls.component.html",
  styleUrls: ["./on-time-controls.component.scss"],
})
export class OnTimeControlsComponent
  extends ControlsComponent
  implements OnInit, OnChanges
{
  @Input() showAdminAreas = true;
  @Input() operatorId: string | null | undefined = "";
  @Output() params = new EventEmitter<PerformanceParams>();

  previousParams: PerformanceParams = {
    fromTimestamp: "",
    toTimestamp: "",
    filters: {},
  };

  filtersSubject = new BehaviorSubject<PerformanceFiltersInputType>({});

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected dateRangeService: DateRangeService,
    public panelService: PanelService,
    public onTimePanel: OnTimePanelService,
  ) {
    super(router, route, dateRangeService, panelService, onTimePanel);
  }

  handleParamsUpdate(value: PerformanceParams): void {
    this.previousParams = value;
    this.params.emit(this.previousParams);
  }

  getPerformanceFilters(
    paramMap: ParamMap,
    queryParams: ParamMap,
  ): PerformanceFiltersInputType {
    const filters: PerformanceFiltersInputType = {};

    if (paramMap.get("nocCode")) {
      const operatorId = ifNullOrUndefinedReturnEmptyString(this.operatorId);
      filters.operatorIds = [operatorId];
    }

    if (queryParams.has("adminAreaId")) {
      filters.adminAreaIds = queryParams.getAll("adminAreaId");
    }

    return filters;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.operatorId?.currentValue) {
      this.handleParamsUpdate({
        ...this.previousParams,
        filters: {
          ...this.previousParams.filters,
          operatorIds: [changes.operatorId.currentValue],
        },
      });
    }
  }

  changeAdminAreaIds(adminAreaId: string[]) {
    this.router.navigate([], {
      queryParams: { adminAreaId },
      queryParamsHandling: "merge",
    });
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router.navigate(["/on-time", operator.nocCode], {
      queryParamsHandling: "preserve",
    });
  }

  updateFilters(value: PerformanceFiltersInputType) {
    this.router.navigate([], {
      queryParams: {
        dayOfWeek: value.dayOfWeekFlags
          ? Object.entries(value.dayOfWeekFlags)
              .filter(([_s, v]) => v)
              .map(([s, _v]) => s)
              .join()
          : undefined,
        startTime: value.startTime,
        endTime: value.endTime,
        minDelay: value.minDelay,
        maxDelay: value.maxDelay,
        adminAreaId: value.adminAreaIds,
      },
      queryParamsHandling: "merge",
    });
  }
}
