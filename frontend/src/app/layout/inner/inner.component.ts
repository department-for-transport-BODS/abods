import { Component } from '@angular/core';
/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: '[app-inner]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./inner.component.scss'],
})
export class InnerComponent {}
