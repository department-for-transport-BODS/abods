import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { DashboardOperatorListGQL } from "../../../../generated/graphql";
import { map } from "rxjs/operators";
import { MultiselectCheckboxOption } from "../../gds/multiselect-checkbox/multiselect-checkbox.component";

@Component({
  selector: "app-operator-multi-select",
  templateUrl: "./operator-multi-select.component.html",
  styleUrls: ["./operator-multi-select.component.scss"],
})
export class OperatorMultiSelectComponent implements OnInit {
  @Input() value: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();
  constructor(private operatorListQuery: DashboardOperatorListGQL) {}

  operators = this.operatorListQuery.fetch().pipe(
    map(
      (result) =>
        result.data.operators?.items.map(
          (o): MultiselectCheckboxOption => ({
            label: o.name ?? "",
            value: o.operatorId ?? "",
          }),
        ) ?? [],
    ),
  );

  ngOnInit() {
    this.operatorListQuery.fetch({}).subscribe();
  }

  onSelect($event: string[]) {
    this.value = $event;
    this.selectedChange.emit($event);
  }
}
