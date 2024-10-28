import { DateTime } from 'luxon';
import { VehicleJourney } from './vehicle-journeys-search.service';

const generateKey = (from: DateTime, to: DateTime, lineId: string) => `${from.toISO()}-${to.toISO()}-${lineId}`;

export class FindJourneysCache {
  private findJourneysCache: Map<string, { journey: VehicleJourney[]; expires: DateTime }> = new Map();

  setItem(from: DateTime, to: DateTime, lineId: string, journey: VehicleJourney[]) {
    // Clear cache as we only want to store the last result from findJourneys query
    this.findJourneysCache.clear();
    this.findJourneysCache.set(generateKey(from, to, lineId), {
      journey: journey,
      // Cached item will expire in one hour
      expires: DateTime.now().plus({ hours: 1 }),
    });
  }

  getItem(from: DateTime, to: DateTime, lineId: string): VehicleJourney[] | undefined {
    const key = generateKey(from, to, lineId);
    const item = this.findJourneysCache.get(key);
    if (!item) {
      return undefined;
    }

    if (item.expires.toMillis() < DateTime.now().toMillis()) {
      // Invalidate cache
      this.findJourneysCache.delete(key);
      return undefined;
    }

    return item.journey;
  }
}
