import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DayOfWeekFlagsInputType } from "../../../../generated/graphql";
import { getDefaultDayOfWeekFlags } from "./day-of-week-utils";

@Component({
  selector: "app-day-of-week-select",
  templateUrl: "./day-of-week-select.component.html",
  styleUrls: ["./day-of-week-select.component.scss"],
  standalone: false,
})
export class DayOfWeekSelectComponent {
  @Input() value = getDefaultDayOfWeekFlags();
  @Input() fieldId = "day-of-week";
  @Input() error: string | undefined;
  @Output() selectedChange = new EventEmitter<DayOfWeekFlagsInputType>();

  daysOfWeek: { key: keyof DayOfWeekFlagsInputType; label: string }[] = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thur" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ];

  onSelect($event: DayOfWeekFlagsInputType) {
    this.value = $event;
    this.selectedChange.emit($event);
  }

  toggle(day: string, value: boolean) {
    if (day in this.value) {
      const newVal = {
        ...this.value,
        [day]: value,
      };
      this.value = newVal;
      this.selectedChange.emit(newVal);
    }
  }
}
