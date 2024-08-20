import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { GDSSpacingSizes } from 'src/app/shared/types';

@Component({
  selector: 'app-operator-selector',
  templateUrl: './operator-selector.component.html',
  styleUrls: ['./operator-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OperatorSelectorComponent {
  @Input() operator?: { nocCode?: string | null; operatorId?: string | null; name?: string | null } | null;
  @Input() allOperators?: { nocCode?: string | null; operatorId?: string | null; name?: string | null }[] | null;
  @Input() allowAll = false;
  @Input() spaceAbove?: GDSSpacingSizes;
  @Input() spaceBelow?: GDSSpacingSizes = '6';

  @Output() operatorChange = new EventEmitter<{ nocCode: string; name?: string }>();

  changeOperator(nocCode: string) {
    this.operatorChange.emit({ nocCode });
  }

  get operatorSelectorClasses() {
    return {
      'operator-selector': true,
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    };
  }
}
