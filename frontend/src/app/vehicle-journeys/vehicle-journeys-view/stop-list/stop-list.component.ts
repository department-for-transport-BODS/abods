import { Component, EventEmitter, Input, Output } from '@angular/core';
import { isNotNullOrUndefined } from '../../../shared/rxjs-operators';
import { VehiclePingStop } from '../vehicle-ping-stop.model';
import { StopHoverEvent } from './stop-item/stop-item.component';

@Component({
  selector: 'app-stop-list',
  templateUrl: './stop-list.component.html',
  styleUrls: ['./stop-list.component.scss'],
})
export class StopListComponent {
  @Input() stopList?: VehiclePingStop[];
  @Input() loading?: boolean;
  @Output() stopSelected = new EventEmitter<VehiclePingStop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get isStopList(): boolean {
    return isNotNullOrUndefined(this.stopList) && this.stopList.length > 0;
  }
}
