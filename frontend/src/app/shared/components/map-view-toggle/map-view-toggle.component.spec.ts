import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { ConfigService } from '../../../config/config.service';
import { SharedModule } from '../../shared.module';

import { MapViewToggleComponent } from './map-view-toggle.component';

class MockConfig {
  get mapboxStyle() {
    return 'style1';
  }
  get mapboxSatelliteStyle() {
    return 'style2';
  }
}

describe('MapViewToggleComponent', () => {
  let spectator: Spectator<MapViewToggleComponent>;

  const createComponent = createComponentFactory({
    component: MapViewToggleComponent,
    imports: [SharedModule],
    providers: [
      {
        provide: ConfigService,
        useClass: MockConfig,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should emit selected style', () => {
    spyOn(spectator.component.mapboxStyle, 'emit');

    spectator.click(byText('Default'));

    expect(spectator.component.mapboxStyle.emit).toHaveBeenCalledWith('style1');

    spectator.click(byText('Satellite'));

    expect(spectator.component.mapboxStyle.emit).toHaveBeenCalledWith('style2');
  });
});
