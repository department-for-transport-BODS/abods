import { AfterViewChecked, Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Map } from 'mapbox-gl';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: 'mgl-map[appAutoResizeMap]',
})
export class AutoResizeMapDirective implements OnInit, AfterViewChecked, OnDestroy {
  @Input() appAutoResizeMap!: Map;

  private resizeMap$ = new Subject<void>();
  private containerWidth = 0;
  private destroy$ = new Subject<void>();

  constructor(private elRef: ElementRef) {}

  ngOnInit() {
    this.containerWidth = this.elRef.nativeElement.clientWidth;
    this.resizeMap$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.appAutoResizeMap) {
        this.appAutoResizeMap.resize();
      }
    });
  }

  ngAfterViewChecked() {
    const el = this.elRef.nativeElement as HTMLElement;
    if (el.clientWidth !== this.containerWidth) {
      this.containerWidth = el.clientWidth;
      this.resizeMap$.next();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
