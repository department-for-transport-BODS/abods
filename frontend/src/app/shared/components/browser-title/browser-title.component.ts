import { Component, Input, OnChanges } from '@angular/core';
import { BrowserTitleService } from './browser-title.service';

/*
 * This component will update the browser page title with the content of this element
 *
 * It can be called directly to title a page -
 * but is also included in page-header to ensure that page title and browser title are in sync by default
 */
@Component({
  selector: 'app-browser-title',
  template: `<ng-container *ngIf="renderTitle">{{ title }}</ng-container>`,
})
export class BrowserTitleComponent implements OnChanges {
  @Input() title?: string;
  @Input() renderTitle = false;

  constructor(private browserTitleService: BrowserTitleService) {}

  ngOnChanges() {
    if (this.title) {
      this.browserTitleService.pageTitle = this.title;
    }
  }
}
