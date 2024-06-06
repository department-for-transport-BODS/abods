import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let spectator: Spectator<NotFoundComponent>;
  const createComponent = createComponentFactory(NotFoundComponent);

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
