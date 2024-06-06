import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { NgxTippyModule } from 'ngx-tippy-wrapper';

import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let spectator: Spectator<DropdownComponent>;

  const createComponent = createComponentFactory({
    component: DropdownComponent,
    imports: [NgxTippyModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should set trigger label', () => {
    spectator.component.triggerLabel = 'test';
    spectator.detectChanges();

    expect(spectator.query(byText('test'))).toBeVisible();
  });
});
