import { byText, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { DateTime, Settings } from 'luxon';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { LuxonModule } from 'luxon-angular';
import { JourneyNavComponent } from './journey-nav.component';
import { SharedModule } from '../../../shared/shared.module';
import { LayoutModule } from '../../../layout/layout.module';
import { Location } from '@angular/common';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { fakeAsync, tick } from '@angular/core/testing';

describe('JourneyNavComponent', () => {
  let spectator: SpectatorRouting<JourneyNavComponent>;

  const createComponent = createRoutingFactory({
    component: JourneyNavComponent,
    imports: [SharedModule, LayoutModule, LuxonModule, NgxTippyModule],
    mocks: [SvgIconRegistryService],
    stubsEnabled: false,
    routes: [
      { path: 'vehicle-journeys/VJ001', component: JourneyNavComponent },
      { path: 'vehicle-journeys/VJ002', component: JourneyNavComponent },
      { path: 'vehicle-journeys/VJ003', component: JourneyNavComponent },
    ],
  });

  beforeEach(async () => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    spectator.component.prevNext = [
      {
        vehicleJourneyId: 'VJ001',
        startTime: DateTime.fromISO('2022-08-01T08:45:00.000'),
        servicePattern: 'Chesterfield - Worksop',
        lineNumber: '77',
      },
      {
        vehicleJourneyId: 'VJ003',
        startTime: DateTime.fromISO('2022-08-01T09:05:00.000'),
        servicePattern: 'Worksop - Chesterfield',
        lineNumber: '77',
      },
    ];
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should navigate to previous journey', fakeAsync(() => {
    spectator.router.initialNavigation();
    spectator.router.navigateByUrl('/vehicle-journeys/VJ002?startTime=20220801T0855Z');
    tick();
    spectator.click(byText('08:45'));
    tick();

    expect(spectator.inject(Location).path()).toEqual('/vehicle-journeys/VJ001?startTime=20220801T0845Z');
  }));

  it('should navigate to next journey', fakeAsync(() => {
    spectator.router.initialNavigation();
    spectator.router.navigateByUrl('/vehicle-journeys/VJ002?startTime=20220801T0855Z');
    tick();
    spectator.click(byText('09:05'));
    tick();

    expect(spectator.inject(Location).path()).toEqual('/vehicle-journeys/VJ003?startTime=20220801T0905Z');
  }));

  it('should show a disabled link when no next journey is available', () => {
    spectator.component.next = null;
    spectator.detectChanges();

    expect('.journey-nav__link--disabled').toBeVisible();
  });
});
