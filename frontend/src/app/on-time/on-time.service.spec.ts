import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { OnTimeService, ServicePerformance, TimeOfDayData } from './on-time.service';
import objectContaining = jasmine.objectContaining;

const performance = (
  early: number,
  late: number,
  onTime: number,
  scheduledDepartures: number,
  actualDepartures: number,
  averageDelay: number
) =>
  ({
    early,
    late,
    onTime,
    total: early + late + onTime,
    scheduledDepartures,
    actualDepartures,
    averageDelay,
  } as ServicePerformance);

describe('OnTimeService', () => {
  let spectator: SpectatorService<OnTimeService>;
  const createService = createServiceFactory({ service: OnTimeService, imports: [ApolloTestingModule] });

  beforeEach(() => (spectator = createService()));

  it('should leave empty on-time performance histogram data empty', () => {
    const actual = spectator.service.fillDelayFrequencyGaps([]);

    expect(actual.length).toEqual(0);
  });

  it('should fill gaps in on-time performance histogram', () => {
    expect(spectator.service).toBeTruthy();
    const incompleteData = [
      { bucket: -5, frequency: 100 },
      { bucket: -3, frequency: 500 },
      { bucket: -2, frequency: 2000 },
      { bucket: -1, frequency: 7000 },
      { bucket: 0, frequency: 15000 },
      { bucket: 1, frequency: 19000 },
      { bucket: 2, frequency: 12000 },
      { bucket: 3, frequency: 9000 },
      { bucket: 4, frequency: 3000 },
      { bucket: 5, frequency: 900 },
      { bucket: 6, frequency: 50 },
      { bucket: 8, frequency: 30 },
      { bucket: 11, frequency: 10 },
      { bucket: 15, frequency: 1 },
    ];

    const actual = spectator.service.fillDelayFrequencyGaps(incompleteData);

    expect(actual.length).toEqual(21);
    expect(actual).toContain({ bucket: -4, frequency: 0 });
    expect(actual).toContain({ bucket: 7, frequency: 0 });
    expect(actual).toContain({ bucket: 9, frequency: 0 });
    expect(actual).toContain({ bucket: 10, frequency: 0 });
    expect(actual).toContain({ bucket: 12, frequency: 0 });
    expect(actual).toContain({ bucket: 13, frequency: 0 });
    expect(actual).toContain({ bucket: 14, frequency: 0 });
  });

  it('should not fill gaps in complete on-time performance histogram data', () => {
    const completeData = [
      { bucket: -5, frequency: 100 },
      { bucket: -4, frequency: 200 },
      { bucket: -3, frequency: 500 },
      { bucket: -2, frequency: 2000 },
      { bucket: -1, frequency: 7000 },
      { bucket: 0, frequency: 15000 },
      { bucket: 1, frequency: 19000 },
      { bucket: 2, frequency: 12000 },
      { bucket: 3, frequency: 9000 },
      { bucket: 4, frequency: 3000 },
      { bucket: 5, frequency: 900 },
    ];

    const actual = spectator.service.fillDelayFrequencyGaps(completeData);

    expect(actual.length).toEqual(11);
    expect(actual).toEqual(completeData);
  });

  it('should leave empty time-of-day-data empty', () => {
    const actual = spectator.service.fillTimeOfDayGaps([]);

    expect(actual.length).toEqual(0);
  });

  it('should fill gaps in time-of-day punctuality data', () => {
    const etc = {
      early: 100,
      onTime: 100,
      late: 100,
      total: 300,
      earlyRatio: 1,
      onTimeRatio: 1,
      lateRatio: 1,
      completedRatio: 1,
    };
    const incompleteData: TimeOfDayData[] = [
      { timeOfDay: '06:00', ...etc },
      { timeOfDay: '07:00', ...etc },
      { timeOfDay: '08:00', ...etc },
      { timeOfDay: '09:00', ...etc },
      { timeOfDay: '10:00', ...etc },
      { timeOfDay: '11:00', ...etc },
      { timeOfDay: '12:00', ...etc },
      { timeOfDay: '13:00', ...etc },
      { timeOfDay: '14:00', ...etc },
      { timeOfDay: '15:00', ...etc },
      { timeOfDay: '16:00', ...etc },
      { timeOfDay: '17:00', ...etc },
      { timeOfDay: '18:00', ...etc },
      { timeOfDay: '19:00', ...etc },
      { timeOfDay: '21:00', ...etc },
    ];

    const actual = spectator.service.fillTimeOfDayGaps(incompleteData);

    expect(actual.length).toEqual(24);
    expect(actual).toContain(objectContaining({ timeOfDay: '01:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '02:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '03:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '04:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '05:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '20:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '22:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '23:00', noData: 1 }));
    expect(actual).toContain(objectContaining({ timeOfDay: '00:00', noData: 1 }));
  });

  it('should calculate sum and average total values', () => {
    const data = [
      performance(10, 30, 60, 222, 200, 40),
      performance(15, 15, 70, 110, 100, 15),
      performance(5, 40, 55, 52, 50, 70),
      performance(15, 20, 65, 155, 150, 50),
    ];

    const actual = spectator.service.calculateTotals(data);

    expect(actual.length).toEqual(1);
    expect(actual[0].early).toEqual(45);
    expect(actual[0].late).toEqual(105);
    expect(actual[0].onTime).toEqual(250);
    expect(actual[0].earlyRatio).toEqual(0.1125);
    expect(actual[0].lateRatio).toEqual(0.2625);
    expect(actual[0].onTimeRatio).toEqual(0.625);
    expect(actual[0].scheduledDepartures).toEqual(539);
    expect(actual[0].actualDepartures).toEqual(500);
    expect(actual[0].averageDelay).toEqual(41);
  });

  it('should cope with zeroes when calculating sum and average total values', () => {
    const data = [
      performance(0, 0, 0, 0, 0, 0),
      performance(0, 0, 0, 0, 0, 0),
      performance(0, 0, 0, 0, 0, 0),
      performance(0, 0, 0, 0, 0, 0),
    ];

    const actual = spectator.service.calculateTotals(data);

    expect(actual.length).toEqual(1);
    expect(actual[0].early).toEqual(0);
    expect(actual[0].late).toEqual(0);
    expect(actual[0].onTime).toEqual(0);
    expect(actual[0].earlyRatio).toEqual(0);
    expect(actual[0].lateRatio).toEqual(0);
    expect(actual[0].onTimeRatio).toEqual(0);
    expect(actual[0].scheduledDepartures).toEqual(0);
    expect(actual[0].actualDepartures).toEqual(0);
    expect(actual[0].averageDelay).toEqual(0);
  });
});
