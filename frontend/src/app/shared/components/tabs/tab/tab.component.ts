import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tab',
  template: `
    <div class="tab__content" [hidden]="!active">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./tab.component.scss'],
})
export class TabComponent {
  @Input() id?: string;
  @Input() tabTitle?: string;
  @Output() opened = new EventEmitter();
  @Output() closed = new EventEmitter();

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (value !== this._active) {
      value ? this.opened.emit() : this.closed.emit();
    }
    this._active = value;
  }
  private _active = false;
}
