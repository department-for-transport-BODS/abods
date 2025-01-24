import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core";
import { PerformanceFiltersInputType } from "../../../generated/graphql";
import { AdminArea, AdminAreaService } from "../admin-area/admin-area.service";
import { isNotNullOrUndefined } from "../../shared/rxjs-operators";
import { map } from "rxjs/operators";
import { entries as _entries } from "lodash-es";
import { FilterChipsComponent } from "../../shared/components/filter-chips/filter-chips.component";

export interface DayOfWeekLabel {
  monday: "Mon";
  tuesday: "Tue";
  wednesday: "Wed";
  thursday: "Thur";
  friday: "Fri";
  saturday: "Sat";
  sunday: "Sun";
}

@Component({
  selector: "app-on-time-filter-chips",
  templateUrl: "./filter-chips.component.html",
  styleUrls: ["./filter-chips.component.scss"],
})
export class OnTimeFilterChipsComponent
  extends FilterChipsComponent
  implements OnChanges
{
  @Input() showAdminAreas = true;
  @Input() filters: PerformanceFiltersInputType = {};
  @Output() filterChange = new EventEmitter<PerformanceFiltersInputType>();

  adminAreas: AdminArea[] = [];

  constructor(private adminAreaService: AdminAreaService) {
    super();
    this.adminAreaService = adminAreaService;
  }

  ngOnChanges() {
    const nocCode = this.filters.nocCodes?.[0];
    const adminAreaIds =
      this.filters.adminAreaIds?.filter(isNotNullOrUndefined) ?? [];

    // This ought to happen synchronously, since admin area data should be cached and never change
    (nocCode
      ? this.adminAreaService.fetchAdminAreasForOperator(nocCode)
      : this.adminAreaService.fetchAdminAreas()
    )
      .pipe(
        map((adminAreas) =>
          adminAreas.filter((adminArea) => adminAreaIds.includes(adminArea.id)),
        ),
      )
      .subscribe((adminAreas) => (this.adminAreas = adminAreas));
  }

  clearAdminAreaFilter(adminAreaId: string) {
    this.updateFilters({
      ...this.filters,
      adminAreaIds: this.filters.adminAreaIds?.filter(
        (id) => id !== adminAreaId,
      ),
    });
  }

  updateFilters(filters: PerformanceFiltersInputType) {
    this.filters = filters;
    this.filterChange.emit(filters);
  }
}
