import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  InputMaybe,
  PerformanceFiltersInputType,
} from "../../../generated/graphql";
import { AdminAreaService } from "../admin-area/admin-area.service";
import { map, takeUntil } from "rxjs/operators";
import { MultiselectCheckboxOption } from "../../shared/gds/multiselect-checkbox/multiselect-checkbox.component";
import { BehaviorSubject, Subject } from "rxjs";
import { convertToParamMap, ParamMap } from "@angular/router";

@Component({
  selector: "app-on-time-filters",
  templateUrl: "./on-time-filters.component.html",
  styleUrls: ["./on-time-filters.component.scss"],
})
export class OnTimeFiltersComponent
  implements OnDestroy, OnInit, AfterViewInit
{
  @Input() set filters(value: PerformanceFiltersInputType | null) {
    if (!value) {
      value = {};
    }

    this.inputFilters = value;
  }

  @Input() set paramMap(paramMap: ParamMap | null) {
    if (!paramMap) {
      paramMap = convertToParamMap({});
    }

    const operatorId = paramMap.get("nocCode");
    const lineId = paramMap.get("lineId");
    if (operatorId) {
      this.operator$.next(operatorId);
    }
    this.operatorId = operatorId;
    this.lineId = lineId;

    if (this.operatorId && !this.lineId) {
      this.showAdminAreas = true;
    }
  }

  @Input() set queryParamMap(queryParamMap: ParamMap | null) {
    if (!queryParamMap) {
      queryParamMap = convertToParamMap({});
    }

    this.adminAreaIds = queryParamMap.getAll("adminAreaId");
    this.initialAdminAreaIds = this.adminAreaIds;
  }

  inputFilters: PerformanceFiltersInputType = {};
  operatorId: string | null = null;
  lineId: string | null = null;
  showAdminAreas = false;

  initialAdminAreaIds: InputMaybe<string[]> | undefined = [];
  adminAreas$ = new BehaviorSubject<MultiselectCheckboxOption[]>([]);
  adminAreaIds: string[] = [];

  @Output() filtersChange = new EventEmitter<PerformanceFiltersInputType>();
  @Output() closeFilters = new EventEmitter();

  operator$ = new Subject<string | undefined>();
  private destroy$ = new Subject<void>();

  constructor(private adminAreaService: AdminAreaService) {}
  ngAfterViewInit(): void {
    if (this.operatorId) {
      this.operator$.next(this.operatorId);
    }
  }

  ngOnInit(): void {
    this.operator$.subscribe((operatorId) => {
      if (operatorId) {
        return this.adminAreaService
          .fetchAdminAreasForOperator(operatorId)
          .pipe(
            takeUntil(this.destroy$),
            map((areas) =>
              areas
                .map(
                  (area) =>
                    ({
                      label: area.name,
                      value: area.id,
                    }) as MultiselectCheckboxOption,
                )
                .sort(
                  (
                    a: MultiselectCheckboxOption,
                    b: MultiselectCheckboxOption,
                  ) => a.label.localeCompare(b.label),
                ),
            ),
          )
          .subscribe((data) => {
            this.adminAreas$.next(data);
          });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  apply(value: PerformanceFiltersInputType) {
    const newFilters: Pick<PerformanceFiltersInputType, "adminAreaIds"> = {};

    if (this.adminAreaIds.length) {
      newFilters.adminAreaIds = this.adminAreaIds;
    }

    if (!this.showAdminAreas) {
      // We preserve the admin areas for returning to All services page
      newFilters.adminAreaIds = this.initialAdminAreaIds;
    }

    this.filtersChange.emit({ ...value, ...newFilters });
  }

  cancel() {
    this.closeFilters.emit();
  }

  resetToDefault() {
    if (this.lineId) {
      this.filtersChange.emit({ adminAreaIds: this.initialAdminAreaIds });
    } else {
      this.filtersChange.emit({});
    }
  }
}
