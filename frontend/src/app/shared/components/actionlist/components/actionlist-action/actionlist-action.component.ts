import { Component, Input, Output, EventEmitter } from '@angular/core';
/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: '[app-actionlist-action]',
  templateUrl: 'actionlist-action.component.html',
  styleUrls: ['./actionlist-action.component.scss'],
})
export class ActionListActionComponent {
  @Input() route?: unknown[] | string; // use when routing to an internal page
  @Input() disabled = false;
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  get actionListActionClasses() {
    return {
      'actionlist-action': true,
      unbuttoned: !this.route,
      'actionlist-action--disabled': this.disabled,
    };
  }
}
