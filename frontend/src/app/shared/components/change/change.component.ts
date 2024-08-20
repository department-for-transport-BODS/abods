import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-change',
  template: `<div [ngClass]="changeClasses">
    <app-tooltip [message]="tooltip" [underline]="true"
      ><span class="change__value">{{ value }}%</span></app-tooltip
    >
  </div>`,
  styleUrls: ['./change.component.scss'],
})
export class ChangeComponent {
  @Input() size?: 'small'; // small has font-size of 16
  @Input() direction?: 'increase' | 'decrease';
  @Input() value?: string;
  @Input() tooltip?: string;

  get changeClasses() {
    return {
      change: true,
      [`change--${this.size}`]: this.size,
      [`change--${this.direction}`]: this.direction,
    };
  }
}
