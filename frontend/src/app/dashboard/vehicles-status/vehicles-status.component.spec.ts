import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { VehiclesStatusComponent } from './vehicles-status.component';

describe('VehiclesStatusComponent', () => {
  let spectator: Spectator<VehiclesStatusComponent>;
  let component: VehiclesStatusComponent;

  const createComponent = createComponentFactory({
    component: VehiclesStatusComponent,
    imports: [LayoutModule, SharedModule, RouterTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });
});
