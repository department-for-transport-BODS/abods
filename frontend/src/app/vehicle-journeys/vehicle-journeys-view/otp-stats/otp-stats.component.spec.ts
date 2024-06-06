import { byTextContent, createComponentFactory, Spectator } from '@ngneat/spectator';
import { StatComponent } from 'src/app/shared/components/stat/stat.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OnTimePerformanceStats } from '../vehicle-journey-view.model';
import { OtpStatsComponent } from './otp-stats.component';

const otpStats: OnTimePerformanceStats = {
  early: {
    percent: 0.0625,
    total: 16,
    value: 1,
  },
  late: { percent: 0, total: 16, value: 0 },
  noData: { percent: 0.4375, total: 16, value: 7 },
  onTime: { percent: 0.5, total: 16, value: 8 },
};

describe('OtpStatsComponent', () => {
  let spectator: Spectator<OtpStatsComponent>;
  let component: OtpStatsComponent;

  const createComponent = createComponentFactory({
    component: OtpStatsComponent,
    imports: [SharedModule],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { otpStats: otpStats, loading: false } });
    component = spectator.component;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct metrics', () => {
    expect(spectator.query(byTextContent('88.89%', { selector: '.stat__value' }))).toBeVisible();
    expect(spectator.query(byTextContent('0%', { selector: '.stat__value' }))).toBeVisible();
    expect(spectator.query(byTextContent('11.11%', { selector: '.stat__value' }))).toBeVisible();
    expect(spectator.query(byTextContent('43.75%', { selector: '.stat__value' }))).toBeVisible();
  });

  it('should display correct tooltips', () => {
    expect(spectator.queryAll(StatComponent)[0].tooltip).toEqual(
      '8 of 9 recorded stop departures were between 1 minute early and 5 minutes 59 seconds late.'
    );

    expect(spectator.queryAll(StatComponent)[1].tooltip).toEqual(
      '0 of 9 recorded stop departures were more than 5 minutes 59 seconds late.'
    );

    expect(spectator.queryAll(StatComponent)[2].tooltip).toEqual(
      '1 of 9 recorded stop departures were more than 1 minute early.'
    );

    expect(spectator.queryAll(StatComponent)[3].tooltip).toEqual(
      '7 of 16 stop departures have limited or missing real-time data so we are unable to calculate an accurate on-time performance figure.'
    );
  });
});
