import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { DateTime, Settings } from 'luxon';
import { SharedModule } from 'src/app/shared/shared.module';
import { FeedMonitoringModule } from '../../feed-monitoring.module';
import { DatenavItemComponent } from './datenav-item/datenav-item.component';
import { DatenavComponent } from './datenav.component';

describe('DatenavComponent', () => {
  let spectator: Spectator<DatenavComponent>;

  const createComponent = createComponentFactory({
    component: DatenavComponent,
    imports: [SharedModule, FeedMonitoringModule],
    declarations: [DatenavItemComponent],
  });

  // Set the zone manually, as we haven't set Settings.defaultZone yet
  const items = [
    { heat: 0, date: DateTime.fromISO('2020-11-19T00:00Z', { zone: 'utc' }) },
    { heat: 1, date: DateTime.fromISO('2020-11-20T00:00Z', { zone: 'utc' }) },
    { heat: 2, date: DateTime.fromISO('2020-11-21T00:00Z', { zone: 'utc' }) },
    { heat: 3, date: DateTime.fromISO('2020-11-22T00:00Z', { zone: 'utc' }) },
    { heat: 4, date: DateTime.fromISO('2020-11-23T00:00Z', { zone: 'utc' }) },
    { heat: 5, date: DateTime.fromISO('2020-11-24T00:00Z', { zone: 'utc' }) },
    { heat: 6, date: DateTime.fromISO('2020-11-25T00:00Z', { zone: 'utc' }) },
  ];

  beforeEach(async () => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1606780800000; // 2020-12-01

    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should display buttons for each item in map', () => {
    spectator.component.stats = items;

    spectator.detectChanges();

    const navitems = spectator.queryAll(DatenavItemComponent);

    expect(navitems).toHaveLength(7);

    items.forEach(({ heat, date }, inx) => {
      expect(navitems[inx].heat).toEqual(heat);
      expect(navitems[inx].date).toEqual(date);
      expect(navitems[inx].active).toEqual(false);
    });
  });

  it('should set active state on selected date', () => {
    spectator.component.stats = items;

    const selectedDate = DateTime.fromISO('2020-11-22T00:00Z');
    spectator.component.date = selectedDate;

    spectator.detectChanges();

    const navitems = spectator.queryAll(DatenavItemComponent);

    const selectedItem = navitems.find(({ date }) => date?.toMillis() === selectedDate.toMillis());

    expect(selectedItem?.active).toBeTrue();
  });

  it('should emit date on click', () => {
    const spy = spyOn(spectator.component.dateSelected, 'emit');

    spectator.component.stats = items;
    spectator.detectChanges();

    spectator.click(byText('20 November'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spectator.component.dateSelected.emit).toHaveBeenCalledWith(DateTime.fromISO('2020-11-20'));
  });

  it('should show next and previous buttons', () => {
    spectator.component.stats = items;
    spectator.component.date = DateTime.fromISO('2020-11-22T00:00Z');
    spectator.detectChanges();

    const prev = spectator.query(byText('Previous'));

    expect(prev).toBeTruthy();

    const next = spectator.query(byText('Next'));

    expect(next).toBeTruthy();
  });

  it('should emit event on previous click', () => {
    spyOn(spectator.component.dateSelected, 'emit');
    const selectedDate = DateTime.fromISO('2020-11-22T00:00Z');
    const expectedDate = DateTime.fromISO('2020-11-21T00:00Z');

    spectator.component.stats = items;
    spectator.component.date = selectedDate;
    spectator.detectChanges();

    spectator.click(byText('Previous'));

    expect(spectator.component.dateSelected.emit).toHaveBeenCalledTimes(1);
    expect(spectator.component.dateSelected.emit).toHaveBeenCalledWith(expectedDate);
  });

  it('should emit event on next click', () => {
    spyOn(spectator.component.dateSelected, 'emit');
    const selectedDate = DateTime.fromISO('2020-11-22T00:00Z');
    const expectedDate = DateTime.fromISO('2020-11-23T00:00Z');

    spectator.component.stats = items;
    spectator.component.date = selectedDate;
    spectator.detectChanges();

    spectator.click(byText('Next'));

    expect(spectator.component.dateSelected.emit).toHaveBeenCalledTimes(1);
    expect(spectator.component.dateSelected.emit).toHaveBeenCalledWith(expectedDate);
  });

  it('should not emit event on next click if at end of range', () => {
    spyOn(spectator.component.dateSelected, 'emit');
    const selectedDate = DateTime.fromISO('2020-11-25T00:00Z');

    spectator.component.stats = items;
    spectator.component.date = selectedDate;
    spectator.detectChanges();

    spectator.click(byText('Next'));

    expect(spectator.component.dateSelected.emit).not.toHaveBeenCalled();
  });

  it('should not emit event on prev click if at end of range', () => {
    spyOn(spectator.component.dateSelected, 'emit');
    const selectedDate = DateTime.fromISO('2020-11-19T00:00Z');

    spectator.component.stats = items;
    spectator.component.date = selectedDate;
    spectator.detectChanges();

    spectator.click(byText('Previous'));
    spectator.detectChanges();

    expect(spectator.component.dateSelected.emit).not.toHaveBeenCalled();
  });

  describe('timezones', () => {
    it('should cope with BST', () => {
      Settings.defaultZone = 'Europe/London';
      Settings.now = () => 1598914800000; // 2020-09-01 GMT+01:00, i.e. during BST

      const spy = spyOn(spectator.component.dateSelected, 'emit');

      spectator.component.stats = [
        { heat: 0, date: DateTime.fromISO('2020-08-24T00:00') },
        { heat: 1, date: DateTime.fromISO('2020-08-25T00:00') },
        { heat: 2, date: DateTime.fromISO('2020-08-26T00:00') },
        { heat: 3, date: DateTime.fromISO('2020-08-27T00:00') },
        { heat: 4, date: DateTime.fromISO('2020-08-28T00:00') },
        { heat: 5, date: DateTime.fromISO('2020-08-29T00:00') },
        { heat: 6, date: DateTime.fromISO('2020-08-30T00:00') },
      ];
      spectator.detectChanges();

      spectator.click(byText('27 August'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spectator.component.dateSelected.emit).toHaveBeenCalledWith(
        DateTime.fromISO('2020-08-27T00:00:00.000+01:00')
      );
    });

    it('should cope with timezone difference during BST and when looking at stats from before BST started', () => {
      Settings.defaultZone = 'Europe/London';
      Settings.now = () => 1585695600000; // 2020-04-01 GMT+01:00, i.e. during BST

      spyOn(spectator.component.dateSelected, 'emit');
      const selectedDate = DateTime.fromISO('2020-02-23T00:00');

      spectator.component.stats = [
        { heat: 0, date: DateTime.fromISO('2020-02-17T00:00') },
        { heat: 1, date: DateTime.fromISO('2020-02-18T00:00') },
        { heat: 2, date: DateTime.fromISO('2020-02-19T00:00') },
        { heat: 3, date: DateTime.fromISO('2020-02-20T00:00') },
        { heat: 4, date: DateTime.fromISO('2020-02-21T00:00') },
        { heat: 5, date: DateTime.fromISO('2020-02-22T00:00') },
        { heat: 6, date: DateTime.fromISO('2020-02-23T00:00') },
      ];
      spectator.component.date = selectedDate;
      spectator.detectChanges();

      spectator.click(byText('Next'));
      spectator.detectChanges();

      expect(spectator.component.dateSelected.emit).not.toHaveBeenCalled();
    });

    it('should cope with timezone difference after BST has ended when looking at stats from BST', () => {
      Settings.defaultZone = 'Europe/London';
      Settings.now = () => 1604188800000; // 2020-11-01 GMT+00:00, i.e. after BST has ended

      spyOn(spectator.component.dateSelected, 'emit');
      const selectedDate = DateTime.fromISO('2020-08-19T00:00');

      spectator.component.stats = [
        { heat: 0, date: DateTime.fromISO('2020-08-19T00:00') },
        { heat: 1, date: DateTime.fromISO('2020-08-20T00:00') },
        { heat: 2, date: DateTime.fromISO('2020-08-21T00:00') },
        { heat: 3, date: DateTime.fromISO('2020-08-22T00:00') },
        { heat: 4, date: DateTime.fromISO('2020-08-23T00:00') },
        { heat: 5, date: DateTime.fromISO('2020-08-24T00:00') },
        { heat: 6, date: DateTime.fromISO('2020-08-25T00:00') },
      ];
      spectator.component.date = selectedDate;
      spectator.detectChanges();

      spectator.click(byText('Previous'));
      spectator.detectChanges();

      expect(spectator.component.dateSelected.emit).not.toHaveBeenCalled();
    });
  });
});
