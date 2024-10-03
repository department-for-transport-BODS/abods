import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { XYChartComponent } from './xy-chart.component';

describe('XYChartComponent', () => {
  let spectator: Spectator<XYChartComponent>;

  const createComponent = createComponentFactory({
    component: XYChartComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
