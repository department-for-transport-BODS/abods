import { DateTime } from 'luxon';
import { Observable, of } from 'rxjs';
import { VehicleJourney } from './vehicle-journeys-search.service';

type FindJourneysCacheKey = {
  key: string;
};

export class FindJourneysCache {
  private findJourneysCache: Map<string, { journey: VehicleJourney[]; expires: DateTime }> = new Map();

  static generateKey(from: DateTime, to: DateTime, lineId: string): FindJourneysCacheKey {
    return { key: `${from.toISO()}-${to.toISO()}-${lineId}` };
  }

  setItem(key: FindJourneysCacheKey, journey: VehicleJourney[]) {
    // Clear cache as we only want to store the last result from findJourneys query
    this.clearCache();
    this.findJourneysCache.set(key.key, {
      journey: journey,
      // Cached item will expire in one hour
      expires: DateTime.now().plus({ hours: 1 }),
    });
  }

  hasItem(key: FindJourneysCacheKey): boolean {
    if (this.findJourneysCache.has(key.key)) {
      const expires = this.findJourneysCache.get(key.key)?.expires as DateTime;
      if (expires.toMillis() < DateTime.now().toMillis()) {
        // Invalidate cache
        this.findJourneysCache.delete(key.key);
        return false;
      } else {
        return true;
      }
    }
    return false;
  }

  getItem(key: FindJourneysCacheKey): Observable<VehicleJourney[]> {
    return of(this.findJourneysCache.get(key.key)?.journey as VehicleJourney[]);
  }

  clearCache(): void {
    this.findJourneysCache.clear();
  }
}
