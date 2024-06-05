import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateTime } from 'luxon';

export interface IHeatmap {
  heat: number;
  date: DateTime;
  active?: boolean;
}
@Component({
  selector: 'app-datenav',
  templateUrl: './datenav.component.html',
  styleUrls: ['./datenav.component.scss'],
})
export class DatenavComponent {
  @Input() stats: IHeatmap[] | undefined = [];
  @Input() date?: DateTime;
  @Output() dateSelected: EventEmitter<DateTime> = new EventEmitter<DateTime>();

  get last() {
    if (!this.stats || this.stats.length === 0) {
      return true;
    }
    return this.date?.equals(this.stats?.[(this.stats?.length ?? 0) - 1]?.date);
  }

  get first() {
    if (!this.stats || this.stats.length === 0) {
      return true;
    }
    return this.date?.equals(this.stats?.[0]?.date);
  }
}
