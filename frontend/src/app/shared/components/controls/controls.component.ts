import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { DateTime } from "luxon";
import { BehaviorSubject, combineLatest, Subject } from "rxjs";
import { distinctUntilChanged, map, takeUntil } from "rxjs/operators";
import {
  DayOfWeekFlagsInputType,
  MatchType,
  PerformanceFiltersInputType,
} from "src/generated/graphql";
import { FormControl } from "@angular/forms";
import { isEqual as _isEqual } from "lodash-es";
import { PerformanceParams } from "../../../on-time/on-time.service";
import { DateRangeService } from "../../services/date-range.service";
import { PanelService } from "../panel/panel.service";
import { FromToPreset, Period, Preset } from "../date-range/date-range.types";
import { ifNullOrUndefinedReturnEmptyString } from "../../rxjs-operators";
import { FiltersComponent } from "../filters/filters.component";

export type TimingPoints = "all-stops" | "timing-points";

@Component({
  selector: "app-controls",
  templateUrl: "controls.component.html",
  styleUrls: ["./controls.component.scss"],
})
export class ControlsComponent implements OnInit, OnChanges, OnDestroy {
  filtersSubject = new BehaviorSubject<PerformanceFiltersInputType>({});

  dateRange = new FormControl(
    this.getDateTimeParams(this.route.snapshot.queryParamMap),
    {
      nonNullable: true,
    },
  );

  // TODO ABOD-350 prefer a form to custom binding
  get timingPointsOption(): TimingPoints {
    return this.filtersSubject.value.timingPointsOnly
      ? "timing-points"
      : "all-stops";
  }

  set timingPointsOption(timingPointsOption: TimingPoints) {
    const allStops = timingPointsOption === "all-stops" || null;
    this.router.navigate([], {
      queryParams: { allStops, timingPointsOnly: null },
      queryParamsHandling: "merge",
    });
  }

  get matchType(): MatchType {
    return this.filtersSubject.value.matchType ?? MatchType.Evidenced;
  }

  set matchType(match_type: MatchType) {
    this.router.navigate([], {
      queryParams: { match_type },
      queryParamsHandling: "merge",
    });
  }

  /** @deprecated this will be removed in ABOD-350 */
  get filters(): PerformanceFiltersInputType {
    return this.filtersSubject.value;
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected dateRangeService: DateRangeService,
  ) {}

  getDateTimeParams(queryParams: ParamMap): FromToPreset {
    let from, to: DateTime;
    let preset: Preset;

    if (queryParams.get("from") && queryParams.get("to")) {
      from = DateTime.fromFormat(
        queryParams.get("from")!,
        "yyyy-MM-dd",
      ).toLocal();
      to = DateTime.fromFormat(queryParams.get("to")!, "yyyy-MM-dd")
        .toLocal()
        .plus({ days: 1 }); // date range is exclusive on the to date
      preset = Preset.Custom;
    } else {
      preset = (queryParams.get("preset") as Period) ?? Period.Last7;
      const presetRange = this.dateRangeService.calculatePresetPeriod(
        preset,
        DateTime.local(),
      );
      from = presetRange.from;
      to = presetRange.to;
    }

    return { from, to, preset };
  }

  getPerformanceFilters(
    paramMap: ParamMap,
    queryParams: ParamMap,
  ): PerformanceFiltersInputType {
    const filters: PerformanceFiltersInputType = {
      timingPointsOnly: true,
      matchType: MatchType.Evidenced,
    };

    const lineId = paramMap.get("lineId");
    if (lineId) {
      filters.lineIds = [lineId];
    }

    if (queryParams.get("dayOfWeek")) {
      const dayOfWeekFlags: DayOfWeekFlagsInputType = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      };

      queryParams
        .get("dayOfWeek")
        ?.split(",")
        .map((day) => {
          if (day as keyof DayOfWeekFlagsInputType)
            dayOfWeekFlags[day as keyof DayOfWeekFlagsInputType] = true;
        });

      filters.dayOfWeekFlags = dayOfWeekFlags;
    }

    if (queryParams.get("startTime")) {
      filters.startTime = queryParams.get("startTime");
    }

    if (queryParams.get("endTime")) {
      filters.endTime = queryParams.get("endTime");
    }

    if (queryParams.get("minDelay")) {
      filters.minDelay = parseInt(queryParams.get("minDelay")!);
    }

    if (queryParams.get("maxDelay")) {
      filters.maxDelay = parseInt(queryParams.get("maxDelay")!);
    }

    if (queryParams.has("timingPointsOnly")) {
      filters.timingPointsOnly =
        queryParams.get("timingPointsOnly") === "true" || undefined;
    }

    if (queryParams.has("match_type")) {
      filters.matchType =
        (queryParams.get("match_type") as MatchType) || MatchType.Evidenced;
    }

    if (queryParams.has("allStops")) {
      filters.timingPointsOnly =
        queryParams.get("allStops") !== "true" || undefined;
    }

    if (queryParams.has("adminAreaId")) {
      filters.adminAreaIds = queryParams.getAll("adminAreaId");
    }

    return filters;
  }
}
