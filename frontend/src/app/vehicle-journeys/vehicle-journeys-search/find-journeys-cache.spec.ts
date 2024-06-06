import { Settings } from 'luxon';
import { FindJourneysCache } from './find-journeys-cache';

describe('FindJourneysCache', () => {
  let cache: FindJourneysCache;
  const key1 = { key: 'test-key-1' };
  const key2 = { key: 'test-key-2' };
  const journeys1 = [{ vehicleJourneyId: 'VJ1', servicePattern: 'SP1', lineNumber: 'LN1' }];
  const journeys2 = [{ vehicleJourneyId: 'VJ2', servicePattern: 'SP2', lineNumber: 'LN2' }];

  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01 00:00:00Z
    cache = new FindJourneysCache();
  });

  it('should set item in cache', () => {
    cache.setItem(key1, journeys1);
    const result$ = cache.getItem(key1);

    expect(cache.hasItem(key1)).toBeTrue();

    result$.subscribe((journey) => {
      expect(journey.length).toEqual(1);
      expect(journey[0].vehicleJourneyId).toEqual('VJ1');
      expect(journey[0].servicePattern).toEqual('SP1');
      expect(journey[0].lineNumber).toEqual('LN1');
    });
  });

  it('should only store the most recent item set in cache', () => {
    cache.setItem(key1, journeys1);
    cache.setItem(key2, journeys2);

    expect(cache.hasItem(key1)).toBeFalse();
    expect(cache.hasItem(key2)).toBeTrue();

    const result$ = cache.getItem(key2);

    result$.subscribe((journey) => {
      expect(journey.length).toEqual(1);
      expect(journey[0].vehicleJourneyId).toEqual('VJ2');
      expect(journey[0].servicePattern).toEqual('SP2');
      expect(journey[0].lineNumber).toEqual('LN2');
    });
  });

  it('should not remove item if it is less than an hour old', () => {
    cache.setItem(key1, journeys1);
    Settings.now = () => 1659315600000; // 2022-08-01 01:00:00.000Z

    expect(cache.hasItem(key1)).toBeTrue();
  });

  it('should remove item if it is expired', () => {
    cache.setItem(key1, journeys1);
    Settings.now = () => 1659315600001; // 2022-08-01 01:00:00.001Z

    expect(cache.hasItem(key1)).toBeFalse();
  });
});
