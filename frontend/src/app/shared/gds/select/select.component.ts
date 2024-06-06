import { EventEmitter, Output, Renderer2 } from '@angular/core';
import { Component, Input, forwardRef, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

@Component({
  selector: 'gds-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label?: string;
  @Input() hideLabel = false;
  @Input()
  get inputId(): string {
    return this._id;
  }
  set inputId(value: string) {
    this._id = value || this._uid;
  }

  get value(): string {
    return this.selectedValue;
  }

  @Input() set value(v: string) {
    if (v !== this.selectedValue) {
      this.selectedValue = v;
      this.onChange(v);
      this.selected.emit(v);
    }
  }

  @Output() selected = new EventEmitter<string>();

  protected _uid = `gds-input-${nextUniqueId++}`;
  selectedValue = '';
  protected _id = '';

  disabled = false;

  @ViewChild('selectInput') selectInput?: ElementRef;

  constructor(private _renderer: Renderer2) {}

  onChange: (_: unknown) => void = () => {
    // Do nothing
  };
  onTouch: (_: unknown) => void = () => {
    // Do nothing
  };

  writeValue(value: string) {
    if (value !== this.selectedValue) {
      this.selectedValue = value;
    }
  }

  registerOnChange(fn: (_: unknown) => any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: (_: unknown) => any) {
    this.onTouch = fn;
  }

  ngAfterViewInit(): void {
    this._renderer.setProperty(this.selectInput?.nativeElement, 'disabled', this.disabled);
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    if (this.selectInput) {
      this._renderer.setProperty(this.selectInput?.nativeElement, 'disabled', isDisabled);
    }
  }
}
