import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VehiclePingStop } from '../../vehicle-ping-stop.model';

export type StopHoverEvent = {
  stop?: VehiclePingStop;
  event: 'enter' | 'leave';
};

@Component({
  selector: 'app-stop-item',
  templateUrl: './stop-item.component.html',
  styleUrls: ['../stop-list.component.scss', './stop-item.component.scss'],
})
export class StopItemComponent {
  @Input() stop?: VehiclePingStop;
  @Input() firstItem?: boolean;
  @Output() stopSelected = new EventEmitter<VehiclePingStop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();
}
