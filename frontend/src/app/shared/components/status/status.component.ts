import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent {
  @Input() active?: boolean;
  @Input() size?: 'small' | 'medium' | 'large';
  @Input() label = true;

  get svgSrc() {
    return `/assets/icons/${this.active ? 'check' : 'cross'}-in-circle-solid.svg`;
  }

  get status() {
    return this.active ? 'active' : 'inactive';
  }

  get statusClasses() {
    return {
      status: true,
      [`status--${this.active ? 'active' : 'inactive'}`]: this.active !== undefined,
      [`status--${this.size}`]: this.size,
    };
  }
}
