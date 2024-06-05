import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

@Component({
  selector: 'gds-checkboxes-item',
  template: `
    <div class="govuk-checkboxes__item checkboxes-item">
      <input
        class="govuk-checkboxes__input"
        [id]="inputId"
        [name]="name"
        type="checkbox"
        [value]="value"
        [checked]="checked"
        [disabled]="disabled"
        (change)="checkedChanged($event)"
      />
      <label class="govuk-label checkboxes-item__label govuk-checkboxes__label" [for]="inputId">{{ label }}</label>
    </div>
  `,
  styleUrls: ['checkboxes-item.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CheckboxesItemComponent),
    },
  ],
})
export class CheckboxesItemComponent {
  @Input() inputId = `gds-checkbox-item-${nextUniqueId++}`;
  @Input() name?: string;
  @Input() value?: string;
  @Input() label?: string;
  @Input() disabled?: boolean;

  _checked = false;
  get checked(): boolean {
    return this._checked;
  }
  @Input()
  set checked(val: boolean) {
    this._checked = val;
    this.onChange(val);
    this.onTouch(val);
  }

  @Output() checkedChange = new EventEmitter<boolean>();

  onChange?: any = () => {
    // do nowt
  };
  onTouch?: any = () => {
    // do nowt
  };

  writeValue(value: any): void {
    this.checked = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  checkedChanged(event: Event): void {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    this.checked = checked;
    this.checkedChange.emit(checked);
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
