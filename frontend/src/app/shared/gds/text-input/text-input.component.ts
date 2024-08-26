import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { GDSSpacingSizes } from 'src/app/shared/types';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

@Component({
  selector: 'gds-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor, AfterViewInit {
  @Input()
  get inputId(): string {
    return this._id;
  }
  set inputId(value: string) {
    this._id = value || this._uid;
  }

  protected _uid = `gds-input-${nextUniqueId++}`;
  protected _id = '';

  @Input() type: 'text' | 'search' | 'number' | 'date' = 'text';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() width?: '2' | '3' | '5' | '10' | '20';
  @Input() label?: string;
  @Input() hideLabel = false;
  @Input() isLabelHeader = false;
  @Input() hint = '';
  @Input() error?: string;
  @Input() required = false;
  @Input() readonly = false;
  @Input() step = '';
  @Input() inputMode = '';
  @Input() pattern = '';
  @Input() max = '';
  @Input() min = '';
  @Input() spaceBelow?: GDSSpacingSizes;
  @Input() spaceAbove?: GDSSpacingSizes;
  @Input() noCal = false;
  @Input() placeholder?: string;
  @Input() autofocus?: boolean;
  @Input() autocomplete?: string;

  @Output() focussed = new EventEmitter<Event>();
  @Output() keydowned = new EventEmitter<Event>();
  @Output() blurred = new EventEmitter<Event>();
  @Output() calClick = new EventEmitter<Event>();

  @ViewChild('textInput') textInput?: ElementRef;
  control = new FormControl();

  get value(): string {
    return this.control.value;
  }

  onTouch: (_: unknown) => void = () => {
    // Do nothing
  };

  writeValue(value: unknown) {
    this.control.patchValue(value);
  }

  registerOnChange(fn: (_: unknown) => any) {
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: (_: unknown) => any) {
    this.onTouch = fn;
  }

  get containerClasses() {
    return {
      'govuk-form-group text-input': true,
      'text-input--no-cal': this.noCal || this.type === 'search',
      'govuk-form-group--error': this.error,
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    };
  }
  get inputClasses() {
    return {
      'govuk-input text-input__input': true,
      [`govuk-input--width-${this.width}`]: this.width,
      'govuk-input--error': this.error,
      'text-input__search-icon': this.type === 'search',
    };
  }

  ngAfterViewInit(): void {
    if (this.autofocus) {
      this.textInput?.nativeElement.focus();
    }
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.control.disable() : this.control.enable();
  }

  preventCalendarPopupFF(event: Event) {
    if (this.noCal) {
      event.preventDefault();
    }
  }

  focus() {
    this.textInput?.nativeElement.focus();
  }

  clearInput() {
    this.control.patchValue('');
    this.control.updateValueAndValidity();
  }
}
