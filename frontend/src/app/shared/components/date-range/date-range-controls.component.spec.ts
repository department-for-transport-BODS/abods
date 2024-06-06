import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { byText, createHostFactory, Spectator } from '@ngneat/spectator';
import { DateTime, Settings } from 'luxon';
import { dateTimeEqualityMatcher } from 'src/test-support/equality';
import { SharedModule } from '../../shared.module';

import { DateRangeControlsComponent } from './date-range-controls.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

describe('DateRangeControlsComponent', () => {
  let spectator: Spectator<DateRangeControlsComponent>;
  let component: DateRangeControlsComponent;
  const createComponent = createHostFactory({
    component: DateRangeControlsComponent,
    imports: [FormsModule, SharedModule, HttpClientTestingModule],
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    // Show Jan and Feb 2020
    Settings.now = () => 1612137600000; // 2021-02-01T00:00:00.000Z

    spectator = createComponent('<app-date-range-controls></app-date-range-controls>');
    component = spectator.component;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should allow valid dates to be applied', () => {
    const fromToValue = spyOn(component.fromToChange, 'emit');
    const closeControls = spyOn(component.closeControls, 'emit');

    spectator.detectChanges();

    spectator.click(byText('4', { selector: '.date-range-controls__calendar:nth-child(1) .date-range-controls__day' }));

    spectator.click(
      byText('11', { selector: '.date-range-controls__calendar:nth-child(1) .date-range-controls__day' })
    );

    spectator.click(byText('Apply'));

    spectator.detectChanges();

    expect(closeControls).toHaveBeenCalledWith();
    expect(fromToValue).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: DateTime.fromISO('2021-01-04T00:00:00.000Z'),
        // to date is _not_ included in the range
        to: DateTime.fromISO('2021-01-12T00:00:00.000Z'),
      })
    );
  });

  it('should not allow no dates to be applied', () => {
    const fromToValue = spyOn(component.fromToChange, 'emit');
    const closeControls = spyOn(component.closeControls, 'emit');

    spectator.detectChanges();

    spectator.click(byText('Apply'));

    spectator.detectChanges();

    expect(closeControls).not.toHaveBeenCalled();
    expect(fromToValue).not.toHaveBeenCalled();
  });

  it('should allow a single date to be applied', () => {
    const fromToValue = spyOn(component.fromToChange, 'emit');
    const closeControls = spyOn(component.closeControls, 'emit');

    spectator.detectChanges();

    spectator.click(byText('4', { selector: '.date-range-controls__calendar:nth-child(1) .date-range-controls__day' }));

    spectator.click(byText('Apply'));

    spectator.detectChanges();

    expect(closeControls).toHaveBeenCalledWith();
    expect(fromToValue).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: DateTime.fromISO('2021-01-04T00:00:00.000Z'),
        // to date is _not_ included in the range
        to: DateTime.fromISO('2021-01-05T00:00:00.000Z'),
      })
    );
  });

  it('should not emit dates if cancelled', () => {
    const fromToValue = spyOn(component.fromToChange, 'emit');
    const closeControls = spyOn(component.closeControls, 'emit');

    spectator.detectChanges();

    spectator.click(byText('4', { selector: '.date-range-controls__calendar:nth-child(1) .date-range-controls__day' }));

    spectator.click(
      byText('11', { selector: '.date-range-controls__calendar:nth-child(1) .date-range-controls__day' })
    );

    spectator.click(byText('Cancel'));

    spectator.detectChanges();

    expect(closeControls).toHaveBeenCalledWith();
    expect(fromToValue).not.toHaveBeenCalled();
  });

  it('should not allow an invalid date to be applied DRA-816', () => {
    const fromToValue = spyOn(component.fromToChange, 'emit');
    const closeControls = spyOn(component.closeControls, 'emit');

    component.start = DateTime.fromISO('2021-02-01T00:00:00.000Z');
    component.end = DateTime.fromISO('Invalid date');

    spectator.detectChanges();

    spectator.click(byText('Apply'));

    expect(closeControls).not.toHaveBeenCalled();
    expect(fromToValue).not.toHaveBeenCalled();
  });
});

describe('DateRangeControlsComponent (Angular)', () => {
  let fixture: ComponentFixture<DateRangeControlsComponent>;

  beforeEach(() => {
    Settings.now = () => 1612137600000; // 2021-02-01T00:00:00.000Z

    TestBed.configureTestingModule({
      declarations: [DateRangeControlsComponent],
      imports: [SharedModule, HttpClientTestingModule],
    });
    fixture = TestBed.createComponent(DateRangeControlsComponent);
  });

  it('should handle dates manually typed in the wrong order DRA-931', () => {
    const fromToValue = spyOn(fixture.componentInstance.fromToChange, 'emit');
    const closeControls = spyOn(fixture.componentInstance.closeControls, 'emit');

    fixture.componentInstance.starting = '2021-01-10';
    fixture.componentInstance.ending = '2021-01-09';

    fixture.detectChanges();

    expect(fixture.componentInstance.invalidDates).toBeFalse();

    fixture.componentInstance.apply();

    expect(closeControls).toHaveBeenCalledWith();
    expect(fromToValue).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: DateTime.fromISO('2021-01-09T00:00:00.000Z'),
        // to date is _not_ included in the range
        to: DateTime.fromISO('2021-01-11T00:00:00.000Z'),
      })
    );
  });

  it('should not accept dates in the future DRA-932', () => {
    fixture.componentInstance.starting = '2021-01-10';
    fixture.componentInstance.ending = '2021-03-12';

    fixture.detectChanges();

    expect(fixture.componentInstance.invalidDates).toBeTrue();

    const applyButton = fixture.debugElement.query(By.css('button[type=submit]'));

    expect(applyButton.attributes.disabled).toBeDefined();
  });
});
