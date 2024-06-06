import { ChangeDetectorRef, Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { TabComponent } from './tab/tab.component';

/**
 * Structural directive to allow the tabs component to conditionally include tab content rather than just hiding and
 * showing it. Use where the content in a tab must be created when the tab is selected and then destroyed once the tab
 * becomes inactive.
 *
 * Usage:
 *   <app-tabs>
 *     <app-tab tabTitle="Foo"><some-component *appTabContent></some-component></app-tab>
 *     <app-tab tabTitle="Bar"><div *appTabContent>...</div></app-tab>
 *   </app-tabs>
 */
@Directive({
  selector: '[appTabContent]',
})
export class TabContentDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
    private enclosingTab: TabComponent,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.enclosingTab.opened.subscribe(() => {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.changeDetectorRef.detectChanges();
    });
    this.enclosingTab.closed.subscribe(() => {
      this.viewContainerRef.clear();
      this.changeDetectorRef.detectChanges();
    });
  }
}
