import { DecimalPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { byText, byTextContent, createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { PunctualityOverview } from '../on-time.service';

import { OverviewStatsComponent } from './overview-stats.component';
import { LuxonModule } from 'luxon-angular';

describe('OverviewStatsComponent', () => {
  let spectator: Spectator<OverviewStatsComponent>;
  let component: OverviewStatsComponent;

  const createComponent = createComponentFactory({
    component: OverviewStatsComponent,
    imports: [SharedModule, LayoutModule, ApolloTestingModule, RouterTestingModule, LuxonModule],
    providers: [DecimalPipe],
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

  const stats: PunctualityOverview = {
    onTime: 283250,
    late: 153750,
    early: 63000,
    noData: 9864,
    completed: 500000,
    scheduled: 509864,
  };

  it('should display on-time percentage', () => {
    const expected = '56.65%';

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(expected, {
          selector: '#on-time-overview-stat-on-time .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it('should display late percentage', () => {
    const expected = '30.75%';

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(expected, {
          selector: '#on-time-overview-stat-late .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it('should display early percentage', () => {
    const expected = '12.6%';

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(expected, {
          selector: '#on-time-overview-stat-early .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it('should display no-data percentage', () => {
    const expected = '1.93%';

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(expected, {
          selector: '#on-time-overview-stat-no-data .stat__value',
        })
      )
    ).toBeTruthy();
  });

  it('should not display excess wait time when not specified', () => {
    component.loading = false;

    spectator.detectChanges();

    expect(spectator.query(byTextContent('Excess wait time', { selector: '.stat__label' }))).not.toBeVisible();
  });

  it('should display excess wait time when specified', () => {
    component.headwayOverview = {
      actual: 3.5,
      scheduled: 2,
      excess: 1.5,
    };
    component.loading = false;
    component.frequent = true;

    spectator.detectChanges();

    expect(spectator.query(byText('Excess wait time'))).toBeVisible();
    expect(spectator.query(byText('1:30'))).toBeVisible();
  });
});
