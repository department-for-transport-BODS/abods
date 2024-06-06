import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HelpdeskPanelService implements OnDestroy {
  get isOpen(): boolean {
    return this._isOpen;
  }
  private _isOpen = false;

  constructor(@Inject(DOCUMENT) private _document: Document) {}

  ngOnDestroy(): void {
    this.close();
  }

  open() {
    this.addBodyClass();
    this._isOpen = true;
  }

  close() {
    this.removeBodyClass();
    this._isOpen = false;
  }

  private addBodyClass() {
    if (this._document.body) {
      // Used to hide scroll bar on body when helpdesk panel is open
      this._document.body.classList.add('helpdesk-open');
    }
  }

  private removeBodyClass() {
    if (this._document.body) {
      // Remove when closing panel to show scroll bar on body
      this._document.body.classList.remove('helpdesk-open');
    }
  }
}
