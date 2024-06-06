import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { DateTime } from 'luxon';
import { dateTimeCloseEnoughToEqualityMatcher } from 'src/test-support/equality';
import { Period } from '../components/date-range/date-range.types';
import { DateRangeService } from './date-range.service';

describe('DateRangeService', () => {
  let spectator: SpectatorService<DateRangeService>;
  const createService = createServiceFactory(DateRangeService);

  beforeEach(() => (spectator = createService()));

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeCloseEnoughToEqualityMatcher);
  });

  describe('calculatePresetPeriod', () => {
    it('last 7 days should calculate with comparison period correctly', () => {
      const testNow = DateTime.fromISO('2021-02-09T10:01:00Z');

      const sevenDaysBefore = DateTime.fromISO('2021-02-02T10:01:00Z');
      const fourteenDaysBefore = DateTime.fromISO('2021-01-26T10:01:00Z');

      expect(spectator.service.calculatePresetPeriod(Period.Last7, testNow)).toEqual(
        jasmine.objectContaining({
          from: sevenDaysBefore.startOf('day'),
          to: testNow.startOf('day'),
          trendFrom: fourteenDaysBefore.startOf('day'),
          trendTo: sevenDaysBefore.startOf('day'),
        })
      );
    });

    it('month to date should calculate with comparison period correctly', () => {
      const testNow = DateTime.fromISO('2021-02-09T10:01:00Z');

      const startOfMonth = DateTime.fromISO('2021-02-01T00:00:00Z');
      const startOfLastMonth = DateTime.fromISO('2021-01-01T00:00:00Z');

      const aMonthAgo = DateTime.fromISO('2021-01-09T10:01:00Z');

      expect(spectator.service.calculatePresetPeriod(Period.MonthToDate, testNow)).toEqual(
        jasmine.objectContaining({
          from: startOfMonth,
          to: testNow.startOf('day'),
          trendFrom: startOfLastMonth,
          trendTo: aMonthAgo.startOf('day'),
        })
      );
    });

    it('month to date should behave correctly toward the end of e.g. March', () => {
      // We shouldn't double count the start of March if we calculate month to date with:
      const testNow = DateTime.fromISO('2021-03-30T10:01:00Z');

      const startOfMonth = DateTime.fromISO('2021-03-01T00:00:00Z');
      const startOfLastMonth = DateTime.fromISO('2021-02-01T00:00:00Z');

      // Luxon kinda takes care of this for us, you could argue that the time here is odd, however
      const aMonthAgo = DateTime.fromISO('2021-02-28T10:01:00Z');

      expect(spectator.service.calculatePresetPeriod(Period.MonthToDate, testNow)).toEqual(
        jasmine.objectContaining({
          from: startOfMonth,
          to: testNow.startOf('day'),
          trendFrom: startOfLastMonth,
          trendTo: aMonthAgo.startOf('day'),
        })
      );
    });

    it('should calculate month to date on 1st of the month sensibly', () => {
      const testToday = DateTime.fromISO('2021-03-01T13:44:00');

      const expectedFrom = DateTime.fromISO('2021-02-01T00:00:00');
      const expectedTo = DateTime.fromISO('2021-03-01T00:00:00');
      const { from, to } = spectator.service.calculatePresetPeriod(Period.MonthToDate, testToday);

      expect(from).toEqual(expectedFrom);
      expect(to).toEqual(expectedTo);
    });

    it('should calculate month to date on 2nd of the month sensibly', () => {
      const testToday = DateTime.fromISO('2021-03-02T13:44:00');

      const expectedFrom = DateTime.fromISO('2021-03-01T00:00:00');
      const expectedTo = DateTime.fromISO('2021-03-02T00:00:00');
      const { from, to } = spectator.service.calculatePresetPeriod(Period.MonthToDate, testToday);

      expect(from).toEqual(expectedFrom);
      expect(to).toEqual(expectedTo);
    });

    it('last month should calculate with comparison period correctly', () => {
      const testNow = DateTime.fromISO('2021-03-30T10:01:00Z');

      const startOfLastMonth = DateTime.fromISO('2021-02-01T00:00:00Z');
      const endOfLastMonth = DateTime.fromISO('2021-02-28T23:59:59.999Z');

      const startOfMonthBefore = DateTime.fromISO('2021-01-01T00:00:00Z');
      const endOfMonthBefore = DateTime.fromISO('2021-01-31T23:59:59.999Z');

      expect(spectator.service.calculatePresetPeriod(Period.LastMonth, testNow)).toEqual(
        jasmine.objectContaining({
          from: startOfLastMonth,
          to: endOfLastMonth,
          trendFrom: startOfMonthBefore,
          trendTo: endOfMonthBefore,
        })
      );
    });

    it('last 28 days should be the default and calculate with comparison period correctly', () => {
      const testNow = DateTime.fromISO('2021-03-30T10:01:00Z');

      const twentyEightDaysBefore = DateTime.fromISO('2021-02-03T10:01:00Z').startOf('day');
      const fiftySixDaysBefore = DateTime.fromISO('2021-01-06T10:01:00Z').startOf('day');

      expect(spectator.service.calculatePresetPeriod(Period.Last28, testNow)).toEqual(
        jasmine.objectContaining({
          from: twentyEightDaysBefore,
          to: testNow.startOf('day'),
          trendFrom: fiftySixDaysBefore,
          trendTo: twentyEightDaysBefore,
        })
      );
    });
  });

  describe('inverseLookup', () => {
    it('should correctly infer 7 days ago as last7', () => {
      const testNow = DateTime.fromISO('2021-07-13T15:48:00Z');

      const from = DateTime.fromISO('2021-07-06T00:00:00Z');

      const actual = spectator.service.inverseLookup({ from, to: testNow }, testNow);

      expect(actual).toEqual('last7');
    });

    it('should default to custom for an unknown period', () => {
      const testNow = DateTime.fromISO('2021-07-13T15:48:00Z');

      const from = DateTime.fromISO('1997-07-01T00:00:00Z');

      const actual = spectator.service.inverseLookup({ from, to: testNow }, testNow);

      expect(actual).toEqual('custom');
    });
  });
});
