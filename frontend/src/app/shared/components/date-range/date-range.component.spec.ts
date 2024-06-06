import { byText, createHostFactory, SpectatorHost } from '@ngneat/spectator';

import { DateRangeComponent } from './date-range.component';
import { DateTime, Settings } from 'luxon';
import { FromToPreset, Preset } from './date-range.types';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { SvgIconRegistryService } from 'angular-svg-icon';

describe('DateRangeComponent', () => {
  let spectator: SpectatorHost<DateRangeComponent>;
  let formControl: FormControl;

  const createHost = createHostFactory({
    component: DateRangeComponent,
    imports: [SharedModule, FormsModule, ReactiveFormsModule],
    mocks: [SvgIconRegistryService],
  });

  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01

    const to = DateTime.local().startOf('day');
    const from = to.minus({ days: 28 });
    const last28 = <FromToPreset>{ from, to, preset: Preset.Last28 };
    formControl = new FormControl(last28);

    spectator = createHost(`<app-date-range [formControl]="formControl"></app-date-range>`, {
      hostProps: { formControl },
    });
  });

  it('should allow user to select preset date range', async () => {
    spectator.selectOption('#date-range-preset', 'last7');

    const value = formControl.value;

    expect(value.from?.toISO()).toEqual('2022-07-25T00:00:00.000Z');
    expect(value.to?.toISO()).toEqual('2022-08-01T00:00:00.000Z');
    expect(value.preset).toEqual(Preset.Last7);
  });

  it('should allow user to select custom date range', async () => {
    spectator.focus('#dateRange');

    spectator.click(byText('11', { selector: '.date-range-controls__calendar:first-child .date-range-controls__day' }));
    spectator.click(byText('15', { selector: '.date-range-controls__calendar:first-child .date-range-controls__day' }));

    spectator.click(byText('Apply'));

    const value = formControl.value;

    expect(value.from?.toISO()).toEqual('2022-06-11T00:00:00.000Z');
    expect(value.to?.toISO()).toEqual('2022-06-16T00:00:00.000Z');
    expect(value.preset).toEqual(Preset.Custom);
  });

  it('should discard changes if user clicks cancel', async () => {
    spectator.focus('#dateRange');

    spectator.click(byText('4', { selector: '.date-range-controls__calendar:first-child .date-range-controls__day' }));
    spectator.click(byText('5', { selector: '.date-range-controls__calendar:first-child .date-range-controls__day' }));

    spectator.click(byText('Cancel'));

    const value = formControl.value;

    expect(value.from?.toISO()).toEqual('2022-07-04T00:00:00.000Z');
    expect(value.to?.toISO()).toEqual('2022-08-01T00:00:00.000Z');
    expect(value.preset).toEqual(Preset.Last28);
  });
});
