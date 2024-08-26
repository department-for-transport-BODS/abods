import { CdkVirtualScrollViewport, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { of } from 'rxjs';

/**
 * Virtual scroll strategy for testing. Tells the viewport to just draw every element.
 */
export class FlatVirtualScrollStrategy implements VirtualScrollStrategy {
  scrolledIndexChange = of(0);
  private viewport: CdkVirtualScrollViewport | null = null;

  constructor(private itemSize: number) {}

  attach(viewport: CdkVirtualScrollViewport) {
    this.viewport = viewport;
    this.viewport?.setTotalContentSize(this.viewport?.getDataLength() * this.itemSize);
    this.viewport?.setRenderedRange({ start: 0, end: this.viewport?.getDataLength() });
    this.viewport?.setRenderedContentOffset(0);
  }

  detach() {
    this.viewport = null;
  }

  onDataLengthChanged() {
    this.viewport?.setTotalContentSize(this.viewport?.getDataLength() * this.itemSize);
    this.viewport?.setRenderedRange({ start: 0, end: this.viewport?.getDataLength() });
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  onContentScrolled() {}
  onContentRendered() {}
  onRenderedOffsetChanged() {}
  scrollToIndex() {}
  /* eslint-enable @typescript-eslint/no-empty-function */
}
