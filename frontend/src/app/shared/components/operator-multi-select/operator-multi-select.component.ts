import { Component, EventEmitter, Input, Output } from "@angular/core";
import { OperatorListGQL } from "../../../../generated/graphql";
import { map } from "rxjs/operators";
import { MultiselectCheckboxOption } from "../../gds/multiselect-checkbox/multiselect-checkbox.component";

@Component({
  selector: "app-operator-multi-select",
  templateUrl: "./operator-multi-select.component.html",
  styleUrls: ["./operator-multi-select.component.scss"],
})
export class OperatorMultiSelectComponent {
  @Input() value: string[] = [];
  @Input() fieldId = "operators";
  @Output() selectedChange = new EventEmitter<string[]>();
  constructor(private operatorListQuery: OperatorListGQL) {}

  operators = this.operatorListQuery.fetch().pipe(
    map((result) =>
      result.data.operators.map(
        (o): MultiselectCheckboxOption => ({
          label: `${o.name} (${o.operatorId})`,
          value: o.operatorId,
        }),
      ),
    ),
  );

  onSelect($event: string[]) {
    this.value = $event;
    this.selectedChange.emit($event);
  }
}
