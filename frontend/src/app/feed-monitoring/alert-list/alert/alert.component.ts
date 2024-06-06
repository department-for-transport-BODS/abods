import { Component, Input } from '@angular/core';
import { AlertLevel, AlertListViewModel } from '../alert-list-view-model';

/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: '[app-alert]',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent {
  @Input() alert!: AlertListViewModel;
  @Input() selected = false;

  get alertClasses() {
    return {
      'alert--warning': this.alert.level === AlertLevel.Warning,
      'alert--error': this.alert.level === AlertLevel.Error,
      'alert--success': this.alert.level === AlertLevel.Success,
      'alert--highlight': this.selected,
    };
  }
}
