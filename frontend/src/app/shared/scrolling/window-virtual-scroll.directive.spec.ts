import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator';
import { WindowVirtualScrollDirective } from './window-virtual-scroll.directive';
import { ScrollingModule } from '@angular/cdk/scrolling';

describe('WindowVirtualScrollDirective', () => {
  let spectator: SpectatorDirective<WindowVirtualScrollDirective>;
  const createDirective = createDirectiveFactory({
    directive: WindowVirtualScrollDirective,
    imports: [ScrollingModule],
    detectChanges: true,
  });

  beforeEach(() => {
    spectator = createDirective(`
      <cdk-virtual-scroll-viewport windowScrollStrategy [itemHeight]="80">
        <div *cdkVirtualFor="let i of [1,2,3]">Item {{i}}</div>
      </cdk-virtual-scroll-viewport>`);
  });

  it('should attach and respond to scroll events', (done) => {
    spectator.dispatchFakeEvent(spectator.element, 'scroll');
    const scroll = spectator.directive.scrollStrategy;
    scroll.scrolledIndexChange.subscribe((i) => {
      expect(i).toEqual(0);
      done();
    });
  });
});
