import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';

import { MapRecentreButtonComponent } from './map-recentre-button.component';

describe('MapRecentreButtonComponent', () => {
  let spectator: Spectator<MapRecentreButtonComponent>;

  const createComponent = createComponentFactory({
    component: MapRecentreButtonComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should emit on click', () => {
    spyOn(spectator.component.recentre, 'emit');
    spectator.click(byText('Re-centre'));

    expect(spectator.component.recentre.emit).toHaveBeenCalledWith();
  });
});
