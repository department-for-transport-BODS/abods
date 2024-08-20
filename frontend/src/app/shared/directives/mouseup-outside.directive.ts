import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appMouseupOutside]',
})
export class MouseupOutsideDirective {
  @Output() appMouseupOutside = new EventEmitter<HTMLElement>();

  @HostListener('document:mouseup', ['$event.target'])
  documentClick = (target: HTMLElement) => {
    if (!this.elRef.nativeElement.contains(target)) {
      this.appMouseupOutside.emit(target);
    }
  };

  constructor(private elRef: ElementRef) {}
}
