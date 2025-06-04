import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appDynamicPanelComponentHost]",
  standalone: false,
})
export class DynamicPanelComponentHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
