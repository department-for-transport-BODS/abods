import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Corridor } from '../corridors.service';

@Component({
  selector: 'app-delete-corridor-modal',
  templateUrl: './delete-corridor-modal.component.html',
})
export class DeleteCorridorModalComponent {
  @Input() corridor?: Corridor;
  @Output() deleteCorridor = new EventEmitter<Corridor>();
}
