import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from "@angular/core";
import { DateTime } from "luxon";
import { FormControl } from "@angular/forms";
import { DateRangeService } from "../../services/date-range.service";
import { ComponentChanges } from "../../../vehicle-journeys/vehicle-journeys-view/journey-map/journey-map.component";

@Component({
  selector: "app-date-range-picker",
  template: `<app-date-range [formControl]="dateRange" />`,
})
export class DateRangePickerComponent implements OnInit, OnChanges {
  constructor(private dateRangeService: DateRangeService) {}
  @Input() from: DateTime = DateTime.now();
  @Input() to: DateTime = DateTime.now();

  @Output() valueChanged = new EventEmitter<{ from: DateTime; to: DateTime }>();

  dateRange = new FormControl(
    {
      from: this.from,
      to: this.to,
      preset: this.getPreset(this.from, this.to),
    },
    { nonNullable: true },
  );

  ngOnChanges(changes: ComponentChanges<DateRangePickerComponent>) {
    if (changes.from) {
      this.setDateRangeValue(changes.from.currentValue, this.to);
    }

    if (changes.to) {
      this.setDateRangeValue(this.from, changes.to.currentValue);
    }
  }

  ngOnInit(): void {
    this.dateRange.valueChanges.subscribe(({ from, to }) => {
      this.valueChanged.emit({ from, to });
    });
  }

  setDateRangeValue(from: DateTime, to: DateTime): void {
    this.dateRange.setValue({
      from: from,
      to: to,
      preset: this.getPreset(this.from, this.to),
    });
  }

  getPreset(from: DateTime, to: DateTime) {
    return this.dateRangeService.inverseLookup(from, to, DateTime.local());
  }
}
