import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { DateTime } from "luxon";
import { FormControl } from "@angular/forms";
import { DateRangeService } from "../../services/date-range.service";

@Component({
  selector: "app-date-range-picker",
  template: `<app-date-range [formControl]="dateRange" />`,
})
export class DateRangePickerComponent implements OnInit {
  constructor(private dateRangeService: DateRangeService) {}
  _from = DateTime.now();
  @Input()
  get from(): DateTime {
    return this._from;
  }
  set from(value: DateTime) {
    this._from = value;
    this.dateRange.setValue({
      from: value,
      to: this.to,
      preset: this.getPreset(value, this.to),
    });
  }
  _to = DateTime.now();
  @Input()
  get to(): DateTime {
    return this._to;
  }
  set to(value: DateTime) {
    this._to = value;
    this.dateRange.setValue({
      from: this.from,
      to: value,
      preset: this.getPreset(this.from, value),
    });
  }
  @Output() valueChanged = new EventEmitter<{ from: DateTime; to: DateTime }>();

  dateRange = new FormControl(
    {
      from: this.from,
      to: this.to,
      preset: this.getPreset(this.from, this.to),
    },
    { nonNullable: true },
  );

  ngOnInit(): void {
    this.dateRange.valueChanges.subscribe(({ from, to }) => {
      this._from = from;
      this._to = to;
      this.valueChanged.emit({ from, to });
    });
  }

  getPreset(from: DateTime, to: DateTime) {
    return this.dateRangeService.inverseLookup(from, to, DateTime.local());
  }
}
