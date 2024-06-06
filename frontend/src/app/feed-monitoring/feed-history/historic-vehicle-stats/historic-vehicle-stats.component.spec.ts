import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { SharedModule } from 'src/app/shared/shared.module';

import { HistoricVehicleStatsComponent } from './historic-vehicle-stats.component';

describe('HistoricVehicleStatsComponent', () => {
  let spectator: Spectator<HistoricVehicleStatsComponent>;
  const createComponent = createComponentFactory({ component: HistoricVehicleStatsComponent, imports: [SharedModule] });

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
