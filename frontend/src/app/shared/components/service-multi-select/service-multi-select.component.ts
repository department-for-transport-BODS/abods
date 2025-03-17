import { Component, EventEmitter, Input, Output } from "@angular/core";
import { OperatorLinesGQL } from "../../../../generated/graphql";
import { map, mergeMap, tap } from "rxjs/operators";
import { MultiselectCheckboxOption } from "../../gds/multiselect-checkbox/multiselect-checkbox.component";
import { combineLatest, of, ReplaySubject } from "rxjs";
import { DateTime } from "luxon";

@Component({
  selector: "app-service-multi-select",
  templateUrl: "./service-multi-select.component.html",
  styleUrls: ["./service-multi-select.component.scss"],
})
export class ServiceMultiSelectComponent {
  @Input() value: string[] = [];
  @Input() fieldId = "services";
  @Output() selectedChange = new EventEmitter<string[]>();
  @Input() set operators(value: string[]) {
    this.operators$.next(value);
  }
  private readonly operators$ = new ReplaySubject<string[]>(1);
  @Input() set startDate(value: DateTime) {
    this.startDate$.next(value);
  }
  private readonly startDate$ = new ReplaySubject<DateTime>(1);
  @Input() set endDate(value: DateTime) {
    this.endDate$.next(value);
  }
  private readonly endDate$ = new ReplaySubject<DateTime>(1);
  constructor(private operatorLinesGQL: OperatorLinesGQL) {}

  services = combineLatest([
    this.operators$,
    this.startDate$,
    this.endDate$,
  ]).pipe(
    mergeMap(([operators, startDate, endDate]) => {
      if (operators.length === 0) return of({ data: { lines: [] } });
      return this.operatorLinesGQL.fetch({
        operatorIds: operators,
        inputDate: startDate.toISO(),
        endDate: endDate.toISO(),
      });
    }),
    map((result) =>
      result.data.lines.map(
        (o): MultiselectCheckboxOption => ({
          label: `${o.number}: ${o.name}`,
          value: o.id,
        }),
      ),
    ),
    tap((options) => {
      const available = options.map((o) => o.value);
      this.onSelect(this.value.filter((s) => available.includes(s)));
    }),
  );

  onSelect($event: string[]) {
    this.value = $event;
    this.selectedChange.emit($event);
  }
}
