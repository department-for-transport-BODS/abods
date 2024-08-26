import { Component, Input } from '@angular/core';

let nextUniqueId = 0;

@Component({
  selector: 'gds-accordion-section',
  templateUrl: './accordion-section.component.html',
  styleUrls: ['./accordion-section.component.scss'],
})
export class AccordionSectionComponent {
  @Input() heading = '';
  @Input() summary = '';

  private _uid = `gds-accordion-section-${nextUniqueId++}`;
  get id(): string {
    return this._uid;
  }

  expanded = false;

  toggleExpandSection() {
    this.expanded = !this.expanded;
  }
}
