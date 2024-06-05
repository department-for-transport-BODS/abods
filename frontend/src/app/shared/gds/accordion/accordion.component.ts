import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { AccordionSectionComponent } from './accordion-section/accordion-section.component';

let nextUniqueId = 0;

@Component({
  selector: 'gds-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionComponent implements AfterContentChecked {
  private _uid = `gds-accordion-${nextUniqueId++}`;
  get id(): string {
    return this._uid;
  }

  @ContentChildren(AccordionSectionComponent) sections!: QueryList<AccordionSectionComponent>;

  expandedAll = false;

  constructor(private ref: ChangeDetectorRef) {}

  toggleExpandAll() {
    this.expandedAll = !this.expandedAll;
    if (this.sections && this.sections.length) {
      this.sections.forEach((section) => {
        section.expanded = this.expandedAll;
      });
    }
  }

  ngAfterContentChecked(): void {
    if (this.sections && this.sections.length) {
      const sectionsExpanded = this.sections.map((section) => section.expanded);
      if (sectionsExpanded.includes(false)) {
        this.expandedAll = false;
      } else {
        this.expandedAll = true;
      }
      this.ref.markForCheck();
    }
  }
}
