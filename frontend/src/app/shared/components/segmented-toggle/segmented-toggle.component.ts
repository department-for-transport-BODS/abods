import { ChangeDetectorRef, Component, ContentChildren, forwardRef, Input, QueryList } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SegmentedToggleItemComponent } from './segmented-toggle-item/segmented-toggle-item.component';
import { SEGMENTED_TOGGLE_GROUP, SegmentedToggleGroup } from './segmented-toggle-group';

@Component({
  selector: 'app-segmented-toggle',
  templateUrl: './segmented-toggle.component.html',
  styleUrls: ['./segmented-toggle.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedToggleComponent),
      multi: true,
    },
    {
      provide: SEGMENTED_TOGGLE_GROUP,
      useExisting: SegmentedToggleComponent,
    },
  ],
})
export class SegmentedToggleComponent implements ControlValueAccessor, SegmentedToggleGroup {
  @Input() legend?: string;
  @Input() hideLegend = true;

  @ContentChildren(SegmentedToggleItemComponent) items?: QueryList<SegmentedToggleItemComponent>;

  selected: SegmentedToggleItemComponent | null = null;

  constructor(private changeDetector: ChangeDetectorRef) {}

  onChange: (value: unknown) => void = () => {
    // Do nothing
  };
  onTouch: () => void = () => {
    // Do nothing
  };

  registerOnChange(fn: (value: unknown) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouch = fn;
  }

  writeValue(obj: string | undefined) {
    this.items?.forEach((item) => {
      item.selected = item.value === obj;
      if (item.selected) {
        this.selected = item;
      }
    });
    this.changeDetector.markForCheck();
  }
}
