import { Injectable } from '@angular/core';
import { filter, from, fromEvent, mergeAll, Observable, of, repeat, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  readonly timeoutDelay = 1000 * 60 * 60 * 12; // 12 hours
  readonly $onInactive: Observable<void>;

  constructor() {
    const events = ['keypress', 'click', 'wheel', 'mousemove', 'ontouchstart'];
    this.$onInactive = from(events.map((e) => fromEvent(document, e))).pipe(
      mergeAll(),
      timeout({ each: this.timeoutDelay, with: () => of(undefined as any) }),
      filter((a) => !a),
      repeat()
    );
  }
}
