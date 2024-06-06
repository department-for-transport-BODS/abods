import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class BrowserTitleService {
  private page?: string;
  private application?: string;

  constructor(private titleService: Title) {}

  set pageTitle(value: string) {
    this.page = value;
    this.updateTitle();
  }

  set applicationTitle(value: string) {
    this.application = value;
    this.updateTitle();
  }

  private updateTitle() {
    if (this.application) {
      const title = (this.page && this.page !== '' ? this.page + ': ' : '') + this.application;
      this.titleService.setTitle(title);
    }
  }
}
