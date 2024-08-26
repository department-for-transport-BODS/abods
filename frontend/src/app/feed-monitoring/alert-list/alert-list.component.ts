import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DateTime } from 'luxon';
import { combineLatest, of, Subject } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { EventType } from 'src/generated/graphql';
import { FeedMonitoringService } from '../feed-monitoring.service';
import { AlertMode, AlertListViewModel } from './alert-list-view-model';

@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss'],
})
export class AlertListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() mode!: AlertMode;
  @Input() date?: DateTime;
  @Input() selectedId: string | null = null;
  @Input() operatorId = '';
  @Output() alerts = new EventEmitter<AlertListViewModel[]>();

  constructor(private fmService: FeedMonitoringService) {}

  private destroy$ = new Subject<void>();

  events: AlertListViewModel[] = [];

  private dateSubject = new Subject<DateTime | undefined>();

  private operatorIdSubject = new Subject<string>();

  loaded = false;

  get title() {
    if (this.mode === AlertMode.LiveStatus) {
      return 'Recent alerts';
    } else {
      return `Alerts for ${this.start?.toFormat('dd MMMM yyyy')}`;
    }
  }

  get end(): DateTime {
    if (this.mode === AlertMode.LiveStatus) {
      return DateTime.local();
    } else {
      return this.start.plus({ days: 1 });
    }
  }

  get start(): DateTime {
    if (this.mode === AlertMode.LiveStatus) {
      return this.end.minus({ days: 1 });
    } else {
      const date = this.date ?? DateTime.local().startOf('day').minus({ days: 1 });
      return date.startOf('day');
    }
  }

  ngOnInit(): void {
    combineLatest([this.dateSubject, this.operatorIdSubject])
      .pipe(
        tap(() => (this.loaded = false)),
        switchMap(() => {
          if (this.start && this.end) {
            return this.fmService.fetchAlerts(this.operatorId, this.start, this.end);
          }
          return of([]);
        }),
        filter((events) => events !== null),
        takeUntil(this.destroy$)
      )
      .subscribe((events) => {
        this.events = (events as EventType[])
          .map((event) => new AlertListViewModel(event, this.mode))
          .filter((x) => x.type)
          .sort((a, b) => a.compare(b));
        this.alerts.emit(this.events);
        this.loaded = true;
      });
    this.dateSubject.next(this.date);
    this.operatorIdSubject.next(this.operatorId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.date) {
      this.dateSubject.next(changes.date.currentValue);
    }
    if (changes.operatorId) {
      this.operatorIdSubject.next(changes.operatorId.currentValue);
    }
  }
}
