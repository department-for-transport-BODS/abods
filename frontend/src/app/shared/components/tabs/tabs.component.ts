import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Output,
  QueryList,
} from '@angular/core';
import { TabComponent } from 'src/app/shared/components/tabs/tab/tab.component';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  template: `
    <div class="tabs">
      <ul class="tabs__list">
        <li
          class="tabs__list-item"
          *ngFor="let tab of tabs"
          [ngClass]="{ 'tabs__list-item--selected': tab.active === true }"
          (click)="selectTab(tab)"
          (keydown.enter)="selectTab(tab); $event.preventDefault()"
          (keydown.space)="selectTab(tab); $event.preventDefault()"
          tabindex="0"
        >
          {{ tab.tabTitle }}
        </li>
      </ul>
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements AfterContentInit {
  @Output() tabChanged = new EventEmitter<TabComponent>();

  @ContentChildren(TabComponent) tabs?: QueryList<TabComponent>;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterContentInit() {
    // Ensure a tab is always selected
    this.tabs?.changes.pipe(startWith([])).subscribe(() => {
      if (!this.tabs?.some(({ active }) => active) && this.tabs?.first) {
        this.tabs.first.active = true;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  openTab(id: string, options?: { emit?: boolean }) {
    const tab = this.tabs?.find((tab) => tab.id === id);
    if (tab) {
      this.selectTab(tab, options);
      return true;
    }
    return false;
  }

  selectTab(tab: TabComponent, options?: { emit?: boolean }) {
    if (tab.active) return;

    this.tabs?.forEach((otab) => (otab.active = false));
    tab.active = true;
    if (options?.emit ?? true) this.tabChanged.emit(tab);
  }
}
