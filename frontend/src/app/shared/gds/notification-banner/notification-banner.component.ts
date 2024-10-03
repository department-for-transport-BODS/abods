import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'gds-notification-banner',
  templateUrl: './notification-banner.component.html',
  styleUrls: ['./notification-banner.component.scss'],
})
export class NotificationBannerComponent {
  @Input() identifier!: string;
  @Input() title!: string;
  @Input() dismissable?: boolean = false;
  @Input() success?: boolean = false;
  @Output() dismissEvent = new EventEmitter<MouseEvent>();

  dismiss(event: MouseEvent) {
    this.dismissEvent.emit(event);
  }
}
