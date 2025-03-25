import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { DateTime } from "luxon";
import { FormControl } from "@angular/forms";
import { DateRangeService } from "../../services/date-range.service";

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.from || changes.to) {
      this.dateRange.setValue({
        from: this.from,
        to: this.to,
        preset: this.getPreset(this.from, this.to),
      });
    }
  }

  ngOnInit(): void {
    this.dateRange.valueChanges.subscribe(({ from, to }) => {
      this.valueChanged.emit({ from, to });
    });
  }

  getPreset(from: DateTime, to: DateTime) {
    return this.dateRangeService.inverseLookup(from, to, DateTime.local());
  }
}
