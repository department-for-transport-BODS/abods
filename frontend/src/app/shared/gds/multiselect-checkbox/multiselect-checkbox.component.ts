import { Component, EventEmitter, forwardRef, Input, Output, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MultiselectCheckboxOption {
  label: string;
  value: string;
  data?: any;
}

// TODO this component was seemingly intended to be reusable, but its been tailored quite specifically
//  to the admin areas dropdown. Should it be split into two components?
@Component({
  selector: 'gds-multiselect-checkbox',
  templateUrl: './multiselect-checkbox.component.html',
  styleUrls: ['./multiselect-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultiselectCheckboxComponent),
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class MultiselectCheckboxComponent implements ControlValueAccessor {
  @Input() options: MultiselectCheckboxOption[] | null = [];
  @Input() showAll = false;
  @Input() showAllLabel = '';
  @Input() pluralLabel = 'selected';
  @Input() placeholderText = '';
  @Input() labelForId?: string;
  @Input() ariaLabel?: string;
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  readonly checkboxItemInputId = 'gds-multiselect-checkbox-checkbox-item-';

  onChange: (value: unknown) => void = () => undefined;

  registerOnChange(fn: (value: unknown) => void) {
    this.onChange = fn;
  }

  registerOnTouched() {
    // Not implemented
  }

  writeValue(value: string[]) {
    this.selected = value ?? [];
  }

  onShowAll() {
    this.selected = [];
    this.onChange(this.selected);
    this.selectedChange.emit(this.selected);
  }

  onOptionChange() {
    this.onChange(this.selected);
    this.selectedChange.emit(this.selected);
  }
}
