import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-map-recentre-button',
  templateUrl: './map-recentre-button.component.html',
  styleUrls: ['./map-recentre-button.component.scss'],
})
export class MapRecentreButtonComponent {
  @Output() recentre = new EventEmitter<void>();
}
