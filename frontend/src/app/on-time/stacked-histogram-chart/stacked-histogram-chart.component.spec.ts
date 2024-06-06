import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { StackedHistogramChartComponent } from './stacked-histogram-chart.component';

describe('TimeOfDayChartComponent', () => {
  let spectator: Spectator<StackedHistogramChartComponent>;
  let component: StackedHistogramChartComponent;

  const createComponent = createComponentFactory({
    component: StackedHistogramChartComponent,
    imports: [LayoutModule, SharedModule, ApolloTestingModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('should create', () => {
    component.category = 'param';
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
