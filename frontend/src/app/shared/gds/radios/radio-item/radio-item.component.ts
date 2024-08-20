import { Component, forwardRef, Input, ElementRef, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

@Component({
  selector: 'gds-radio-item',
  templateUrl: './radio-item.component.html',
  styleUrls: ['./radio-item.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => RadioItemComponent),
    },
  ],
})
export class RadioItemComponent implements ControlValueAccessor {
  @Input() inputName = '';
  @Input() label?: string;
  @Input() value = '';
  @Input() inputId = `gds-radio-item-${nextUniqueId++}`;
  @Input() hint?: string;
  @Input() selectedOption = '';
  @Input() controls: string | null = null;

  changeValue(value: string) {
    this._onChange(value);
  }

  _onChange = (_: unknown) => {
    // Do nothing
  };
  onTouched = () => {
    // Do nothing
  };

  constructor(private _renderer: Renderer2, private _elementRef: ElementRef) {}
  writeValue(value: string): void {
    this._renderer.setProperty(this._elementRef, 'checked', value === this._elementRef.nativeElement.value);
    this.selectedOption = value;
  }
  registerOnChange(fn: (_: unknown) => unknown): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => unknown): void {
    this.onTouched = fn;
  }

  get hintId() {
    return this.hint ? `${this.inputId}-hint` : '';
  }
}
