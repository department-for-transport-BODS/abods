import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PerformanceFiltersInputType } from "src/generated/graphql";
import { isEqual as _isEqual } from "lodash-es";
import { PerformanceParams } from "../on-time.service";
import { DateRangeService } from "../../shared/services/date-range.service";
import { OnTimePanelService } from "./on-time-panel.service";
import { PanelService } from "../../shared/components/panel/panel.service";
import { ControlsComponent } from "../../shared/components/controls/controls.component";
import {
  combineLatest,
  distinctUntilChanged,
  map,
  startWith,
  Subject,
} from "rxjs";

export type TimingPoints = "all-stops" | "timing-points";

@Component({
  selector: "app-on-time-controls",
  templateUrl: "on-time-controls.component.html",
  styleUrls: ["./on-time-controls.component.scss"],
})
export class OnTimeControlsComponent
  extends ControlsComponent
  implements OnInit
{
  @Input() showAdminAreas = true;
  @Input() operatorId: string | null | undefined = "";
  @Output() params = new EventEmitter<PerformanceParams>();

  additionalFilters: PerformanceFiltersInputType = {};

  chipFilter: PerformanceFiltersInputType = {};

  performanceParams$ = new Subject<PerformanceParams>();

  previousParams: PerformanceParams = {
    fromTimestamp: "",
    toTimestamp: "",
    filters: {},
  };

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected dateRangeService: DateRangeService,
    public panelService: PanelService,
    public onTimePanel: OnTimePanelService,
  ) {
    super(router, route, dateRangeService, panelService, onTimePanel);
  }

  ngOnInit(): void {
    const operator$ = this.route.paramMap.pipe(
      map((params) => params.get("nocCode")),
      distinctUntilChanged(),
    );

    const adminAreaId$ = this.route.queryParamMap.pipe(
      map((params) => params.getAll("adminAreaId")), // Extract key3 from query params
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
      ),
      startWith(undefined),
    );

    combineLatest([operator$, adminAreaId$, this.performanceParams$]).subscribe(
      ([operatorId, adminAreaIds, performanceParams]) => {
        this.chipFilter = {
          ...performanceParams.filters,
          operatorIds: operatorId ? [operatorId] : undefined,
          adminAreaIds:
            adminAreaIds && adminAreaIds?.length > 0 ? adminAreaIds : undefined,
        };
        this.params.emit({
          ...performanceParams,
          filters: {
            ...performanceParams.filters,
            operatorIds: operatorId ? [operatorId] : undefined,
            adminAreaIds:
              adminAreaIds && adminAreaIds?.length > 0
                ? adminAreaIds
                : undefined,
          },
        });
      },
    );
  }

  handleParamsUpdate(value: PerformanceParams): void {
    const params: PerformanceParams = {
      ...value,
      filters: {
        ...value.filters,
        ...this.additionalFilters,
      },
    };

    this.performanceParams$.next(params);
  }

  changeAdminAreaIds(adminAreaId: string[]) {
    this.router
      .navigate([], {
        queryParams: { adminAreaId },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router
      .navigate(["/on-time", operator.nocCode], {
        queryParamsHandling: "preserve",
      })
      .catch(console.log);
  }

  updateFilters(value: PerformanceFiltersInputType) {
    this.router
      .navigate([], {
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
      })
      .catch(console.log);
  }
}
