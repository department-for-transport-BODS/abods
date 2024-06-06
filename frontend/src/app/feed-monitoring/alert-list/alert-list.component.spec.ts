import { byText, byTextContent, createComponentFactory, Spectator, SpyObject } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { fakeEvent } from 'src/test-support/faker';
import { FeedMonitoringModule } from '../feed-monitoring.module';
import { FeedMonitoringService } from '../feed-monitoring.service';
import { AlertListComponent } from './alert-list.component';
import * as Faker from 'faker';
import { DateTime } from 'luxon';
import { AlertMode, AlertType } from './alert-list-view-model';
import { SharedModule } from 'src/app/shared/shared.module';
import { AlertComponent } from './alert/alert.component';
import { dateTimeCloseEnoughToEqualityMatcher } from 'src/test-support/equality';

describe('AlertListComponent', () => {
  let spectator: Spectator<AlertListComponent>;
  let service: SpyObject<FeedMonitoringService>;

  const createComponent = createComponentFactory({
    component: AlertListComponent,
    imports: [FeedMonitoringModule, ApolloTestingModule, SharedModule],
    mocks: [FeedMonitoringService],
    declarations: [AlertComponent],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.operatorId = 'OP01';
    service = spectator.inject(FeedMonitoringService);
  });

  beforeAll(() => Faker.seed(434));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should fetch recent events', () => {
    jasmine.addCustomEqualityTester(dateTimeCloseEnoughToEqualityMatcher);

    spectator.component.mode = AlertMode.LiveStatus;

    service.fetchAlerts.and.returnValue(of([]));

    spectator.detectChanges();

    expect(service.fetchAlerts).toHaveBeenCalledWith('OP01', DateTime.local().minus({ days: 1 }), DateTime.local());
  });

  it('should fetch windowed events', () => {
    spectator.component.mode = AlertMode.FeedHistory;

    const startDate = DateTime.fromISO('2020-02-03T00:00:00Z');
    const endDate = DateTime.fromISO('2020-02-04T00:00:00Z');

    spectator.setInput({ date: startDate });

    service.fetchAlerts.and.returnValue(of([]));

    spectator.detectChanges();

    expect(service.fetchAlerts).toHaveBeenCalledWith('OP01', startDate, endDate);
  });

  it('should show message', () => {
    spectator.component.mode = AlertMode.LiveStatus;

    const message = 'This text should be there';

    service.fetchAlerts.and.callFake((_, start, end) =>
      of([fakeEvent({ message, start, end, type: AlertType.VehicleCountDisparityEvent })])
    );

    spectator.detectChanges();

    expect(spectator.query(byText(message))).toBeTruthy();
  });

  const typeTestCases = [
    { type: AlertType.FeedUnavailableEvent, title: 'Feed data unavailable' },
    { type: AlertType.VehicleCountDisparityEvent, title: 'Vehicle count disparity' },
    { type: AlertType.FeedAvailableEvent, title: 'Feed data available' },
  ];

  typeTestCases.forEach(({ type, title }) =>
    it(`should show event type for ${type}`, () => {
      spectator.component.mode = AlertMode.LiveStatus;

      service.fetchAlerts.and.callFake((_, start, end) => of([fakeEvent({ type, start, end })]));

      spectator.detectChanges();

      expect(spectator.query(byText(title))).toBeTruthy();
    })
  );

  it('should update when date changed', () => {
    spectator.component.mode = AlertMode.FeedHistory;

    const startDate = DateTime.fromISO('2020-03-03T00:00:00Z');
    const endDate = DateTime.fromISO('2020-03-04T00:00:00Z');

    service.fetchAlerts.and.returnValue(of([]));

    spectator.component.date = startDate;

    spectator.detectChanges();

    expect(service.fetchAlerts).toHaveBeenCalledWith('OP01', startDate, endDate);
  });

  it('should show no alerts message', () => {
    spectator.component.mode = AlertMode.LiveStatus;

    service = spectator.inject(FeedMonitoringService);

    service.fetchAlerts.and.returnValue(of([]));

    spectator.detectChanges();

    expect(spectator.query(byText('No events have been observed in the feed for this time period.'))).toBeTruthy();
  });

  it('should display feed history alerts in ascending chronological order', () => {
    spectator.component.mode = AlertMode.FeedHistory;

    service.fetchAlerts.and.callFake((_) =>
      of([
        fakeEvent({ start: DateTime.fromISO('2020-12-08T10:52:00Z') }),
        fakeEvent({ start: DateTime.fromISO('2020-12-08T10:50:00Z') }),
        fakeEvent({ start: DateTime.fromISO('2020-12-08T10:51:00Z') }),
      ])
    );

    spectator.setInput({ date: DateTime.fromISO('2020-12-08T00:00:00Z') });

    spectator.detectChanges();

    expect(
      spectator.query(byText('10:50', { selector: '.alert-list__items li:nth-child(1) .alert__timestamp' }))
    ).toBeTruthy();

    expect(
      spectator.query(byText('10:52', { selector: '.alert-list__items li:nth-child(3) .alert__timestamp' }))
    ).toBeTruthy();
  });

  it('should display live status alerts in descending chronological order', () => {
    spectator.component.mode = AlertMode.LiveStatus;

    const now = DateTime.local();
    const time1 = now.minus({ hours: 3, minutes: 1 });
    const time2 = now.minus({ hours: 3, minutes: 2 });
    const time3 = now.minus({ hours: 3, minutes: 3 });

    service.fetchAlerts.and.callFake((_) =>
      of([fakeEvent({ start: time3 }), fakeEvent({ start: time1 }), fakeEvent({ start: time2 })])
    );

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(new RegExp(time1.toFormat('HH:mm')), {
          selector: '.alert-list__items li:nth-child(1) .alert__timestamp',
        })
      )
    ).toBeTruthy();

    expect(
      spectator.query(
        byText(new RegExp(time3.toFormat('HH:mm')), {
          selector: '.alert-list__items li:nth-child(3) .alert__timestamp',
        })
      )
    ).toBeTruthy();
  });
});
