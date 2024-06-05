import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicPanelComponentHost]',
})
export class DynamicPanelComponentHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
