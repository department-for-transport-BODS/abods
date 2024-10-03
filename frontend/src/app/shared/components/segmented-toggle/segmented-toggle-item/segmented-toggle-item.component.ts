import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Optional, Output } from '@angular/core';
import { SEGMENTED_TOGGLE_GROUP, SegmentedToggleGroup } from '../segmented-toggle-group';

let nextUniqueId = 0;

@Component({
  selector: 'app-segmented-toggle-item',
  templateUrl: './segmented-toggle-item.component.html',
  styleUrls: ['./segmented-toggle-item.component.scss'],
})
export class SegmentedToggleItemComponent {
  @Input()
  get selected(): boolean {
    return this._selected;
  }
  set selected(value: boolean) {
    if (this._selected === value) {
      return;
    }
    this._selected = value;
    if (this.group?.selected?.value !== this.value) {
      this.group.selected = this;
    } else if (this.group?.selected?.value === this.value) {
      this.group.selected = null;
    }
    this.changeDetector.markForCheck();
  }

  @Input() identifier = `gds-toggle-item-${nextUniqueId++}`;
  @Input() name?: string;
  @Input() value?: string;
  @Input() label?: string;

  @Output() selectedChange = new EventEmitter();

  private _selected = false;

  constructor(
    @Optional() @Inject(SEGMENTED_TOGGLE_GROUP) private group: SegmentedToggleGroup,
    private changeDetector: ChangeDetectorRef
  ) {}

  onChanged(event: Event) {
    event.stopPropagation();

    this._selected = true;
    this.selectedChange.emit(this.value);

    if (this.group) {
      this.group.onChange(this.value);
      this.group.writeValue(this.value);
    }
  }

  touch() {
    this.group?.onTouch();
  }
}
