import { Component, Input } from '@angular/core';
import { GDSSpacingSizes } from 'src/app/shared/types';

@Component({
  selector: 'app-stack',
  template: '<div [ngClass]="stackClasses" [style.gridTemplateColumns]="columnSizes"><ng-content></ng-content></div>',
  styleUrls: ['./stack.component.scss'],
})
export class StackComponent {
  @Input() childMax?: string;
  @Input() childMin? = '30px';
  @Input() gap?: GDSSpacingSizes = '6';

  get columnSizes() {
    return `repeat(auto-fit, minmax(${this.childMin},${this.childMax ? this.childMax : '1fr'}))`;
  }
  get stackClasses() {
    return {
      stack: true,
      [`stack--gap-${this.gap}`]: true,
    };
  }
}
