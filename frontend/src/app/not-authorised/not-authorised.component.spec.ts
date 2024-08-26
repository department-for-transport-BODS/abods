import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { NotAuthorisedComponent } from './not-authorised.component';

describe('NotAuthorisedComponent', () => {
  let spectator: Spectator<NotAuthorisedComponent>;
  const createComponent = createComponentFactory(NotAuthorisedComponent);

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
