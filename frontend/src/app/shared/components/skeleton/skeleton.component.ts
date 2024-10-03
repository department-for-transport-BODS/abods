import { Component, Input } from '@angular/core';
import { GDSTypeSizes, GDSSpacingSizes } from 'src/app/shared/types';
@Component({
  selector: 'app-skeleton',
  template: '<div [ngClass]="skeletonClasses" [style.width]="width" [style.height]="height"></div>',
  styleUrls: ['./skeleton.component.scss'],
})
export class SkeletonComponent {
  @Input() width?: string;
  @Input() height?: string;
  @Input() appearance?: GDSTypeSizes;
  @Input() spaceAbove?: GDSSpacingSizes;
  @Input() spaceBelow?: GDSSpacingSizes;

  get skeletonClasses() {
    return {
      skeleton: true,
      [`skeleton--${this.appearance}`]: this.appearance,
      [`govuk-!-margin-bottom-${this.spaceBelow}`]: this.spaceBelow,
      [`govuk-!-margin-top-${this.spaceAbove}`]: this.spaceAbove,
    };
  }
}
