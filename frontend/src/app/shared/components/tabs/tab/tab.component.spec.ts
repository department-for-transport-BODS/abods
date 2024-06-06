import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { TabsComponent } from '../tabs.component';

import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  const createComponent = createComponentFactory({
    component: TabComponent,
    declarations: [TabComponent, TabsComponent],
  });

  let spectator: Spectator<TabComponent>;
  let component: TabComponent;

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
