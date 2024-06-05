import { CdkVirtualScrollViewport, VIRTUAL_SCROLL_STRATEGY, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { fromEvent, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Directive,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * Somewhere you'll also need to following styles...
 *
 * ::ng-deep .cdk-virtual-scroll-viewport[windowScrollStrategy] {
 *   contain: none;
 *   .cdk-virtual-scroll-spacer {
 *     position: relative;
 *   }
 * }
 */
export class WindowVirtualScrollStrategy implements VirtualScrollStrategy {
  scrolledIndexChange: Observable<number>;

  private destroy$: Observable<void>;

  private viewport: CdkVirtualScrollViewport | null = null;

  private readonly _scrolledIndexChange = new Subject<number>();
  private readonly destroy = new Subject<void>();

  constructor(private itemSize: number) {
    this.scrolledIndexChange = this._scrolledIndexChange.pipe(distinctUntilChanged());
    this.destroy$ = this.destroy.asObservable();
  }

  attach(viewport: CdkVirtualScrollViewport) {
    this.viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();

    fromEvent(window, 'scroll')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._updateRenderedRange();
      });
  }

  detach() {
    this._scrolledIndexChange.complete();
    this.viewport = null;

    this.destroy.next();
    this.destroy.complete();
  }

  update(itemSize: number) {
    this.itemSize = itemSize;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentScrolled() {
    this._updateRenderedRange();
  }

  onDataLengthChanged() {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  onContentRendered() {
    // not used
  }

  onRenderedOffsetChanged() {
    // not useded
  }

  scrollToIndex(index: number, behavior: ScrollBehavior) {
    if (this.viewport) {
      this.viewport.scrollToOffset(index * this.itemSize, behavior);
    }
  }

  private _updateTotalContentSize() {
    if (!this.viewport) {
      return;
    }

    this.viewport.setTotalContentSize(this.viewport.getDataLength() * this.itemSize);
  }

  private _updateRenderedRange() {
    if (!this.viewport) {
      return;
    }

    const viewportSize = window.innerHeight;
    const viewportRect = this.viewport.elementRef.nativeElement.getBoundingClientRect();

    const top = Math.max(0, -viewportRect.top);
    const bottom = Math.min(viewportSize, viewportRect.bottom) - viewportRect.top;

    const start = Math.floor(top / this.itemSize);
    const end = Math.ceil(bottom / this.itemSize);

    this.viewport.setRenderedRange({ start, end });
    this.viewport.setRenderedContentOffset(this.itemSize * start);
    this._scrolledIndexChange.next(start);
  }
}

@Directive({
  selector: 'cdk-virtual-scroll-viewport[windowScrollStrategy]', // eslint-disable-line @angular-eslint/directive-selector
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: (directive: WindowVirtualScrollDirective) => directive.scrollStrategy,
      deps: [forwardRef(() => WindowVirtualScrollDirective)],
    },
  ],
})
export class WindowVirtualScrollDirective implements OnChanges, AfterViewChecked {
  @Input() itemHeight = 0;
  scrollStrategy: WindowVirtualScrollStrategy = new WindowVirtualScrollStrategy(this.itemHeight);
  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if ('itemHeight' in changes) {
      this.scrollStrategy.update(this.itemHeight);
      this.changeDetectorRef.detectChanges();
    }
  }

  ngAfterViewChecked() {
    this.scrollStrategy.onContentScrolled();
  }
}
