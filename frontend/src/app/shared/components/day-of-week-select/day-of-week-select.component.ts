import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DayOfWeekFlagsInputType } from "../../../../generated/graphql";

const defaultDayOfWeekFlags: DayOfWeekFlagsInputType = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

@Component({
  selector: "app-day-of-week-select",
  templateUrl: "./day-of-week-select.component.html",
  styleUrls: ["./day-of-week-select.component.scss"],
})
export class DayOfWeekSelectComponent {
  @Input() value: DayOfWeekFlagsInputType = defaultDayOfWeekFlags;
  @Input() fieldId = "day-of-week";
  @Input() error: string | undefined;
  @Output() selectedChange = new EventEmitter<DayOfWeekFlagsInputType>();

  onSelect($event: DayOfWeekFlagsInputType) {
    this.value = $event;
    this.selectedChange.emit($event);
  }

  toggle(day: keyof DayOfWeekFlagsInputType, value: boolean) {
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
