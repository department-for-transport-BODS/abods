import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
})
export class ChipComponent {
  @Input() label!: string;
  @Input() value!: string;
  @Output() closeChip = new EventEmitter<void>();

  onClose() {
    this.closeChip.emit();
  }
}
