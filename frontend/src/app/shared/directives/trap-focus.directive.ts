import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, HostBinding, Inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appTrapFocus]',
})
export class TrapFocusDirective implements OnChanges, OnDestroy {
  @Input() appTrapFocus!: boolean;

  @HostBinding('tabIndex') tabIndex = '';

  constructor(private el: ElementRef, @Inject(DOCUMENT) private document: Document) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.appTrapFocus.currentValue) {
      this.start();
    } else if (this.el.nativeElement) {
      this.stop();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  start() {
    window.addEventListener('keydown', this.trapFocus);
    this.tabIndex = '-1';
    this.el.nativeElement.focus();
  }

  stop() {
    window.removeEventListener('keydown', this.trapFocus);
    this.tabIndex = '';
  }

  private trapFocus = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      try {
        const el = this.el.nativeElement;

        if (!el.contains(this.document.activeElement)) {
          event.preventDefault();
          event.stopPropagation();
          el.focus();
        }

        return true;
      } catch (e) {
        return false;
      }
    }

    return false;
  };
}
