import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
    document.body.classList.toggle('js-nav-open');
  }

  closeMenu() {
    this.isOpen = false;
    document.body.classList.remove('js-nav-open');
  }

  navClickOutside(selectedEl: HTMLElement) {
    if (this.isOpen) {
      if (selectedEl.id !== 'nav-toggle') {
        this.toggleMenu();
      }
    }
  }
}
