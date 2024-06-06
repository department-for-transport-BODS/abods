import { DateTime, Settings } from 'luxon';
import { VehicleJourneysGridComponent } from './vehicle-journeys-grid.component';
import { Spectator, byText, createComponentFactory } from '@ngneat/spectator';
import { SimpleChange } from '@angular/core';
import { VehicleJourney } from '../vehicle-journeys-search.service';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('VehicleJourneysGridComponent', () => {
  let spectator: Spectator<VehicleJourneysGridComponent>;
  let component: VehicleJourneysGridComponent;

  const toQueryParamFormat = (date: DateTime) => date.toUTC()?.toISO({ format: 'basic', suppressSeconds: true });

  const t1 = DateTime.fromISO('2022-08-01T06:45:00');
  const t2 = DateTime.fromISO('2022-08-01T06:55:00');
  const t3 = DateTime.fromISO('2022-08-01T07:28:00');
  const t4 = DateTime.fromISO('2022-08-01T15:38:00');
  const t5 = DateTime.fromISO('2022-08-01T15:55:00');
  const journeys: VehicleJourney[] = [
    {
      vehicleJourneyId: 'VJefdb0f42',
      startTime: t1,
      servicePattern: 'St Annes - Blackpool Town Centre',
      lineNumber: '76',
    },
    {
      vehicleJourneyId: 'VJf3c22dad',
      startTime: t2,
      servicePattern: 'Poulton-le-Fylde - St Annes',
      lineNumber: '76',
    },
    {
      vehicleJourneyId: 'VJa3968321',
      startTime: t3,
      servicePattern: 'Blackpool Town Centre - St Annes',
      lineNumber: '76',
    },
    {
      vehicleJourneyId: 'VJ4aa8804d',
      startTime: t4,
      servicePattern: 'Blackpool Town Centre - St Annes',
      lineNumber: '76',
    },
    {
      vehicleJourneyId: 'VJa921fcb5',
      startTime: t5,
      servicePattern: 'St Annes - Blackpool Town Centre',
      lineNumber: '76',
    },
  ];

  const createComponent = createComponentFactory({
    component: VehicleJourneysGridComponent,
    imports: [SharedModule, RouterTestingModule],
  });

  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    component = spectator.component;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group start times by service patterns', async () => {
    component.ngOnChanges({ data: <SimpleChange>{ currentValue: journeys } });

    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    const gridEls = spectator.queryAll('.journey-search-grid');

    expect(spectator.query(byText('76: St Annes - Blackpool Town Centre'))).toBeVisible();
    expect(gridEls[0].textContent).toContain('06:45');
    expect(gridEls[0].textContent).toContain('15:55');
    expect(spectator.query(byText('76: Poulton-le-Fylde - St Annes'))).toBeVisible();
    expect(gridEls[1].textContent).toContain('06:55');
    expect(spectator.query(byText('76: Blackpool Town Centre - St Annes'))).toBeVisible();
    expect(gridEls[2].textContent).toContain('07:28');
    expect(gridEls[2].textContent).toContain('15:38');
  });

  it('should add routerLink to start times with vehicleJourneyId and query params', async () => {
    component.operatorId = 'OP3';
    component.serviceId = 'LI4728';
    component.ngOnChanges({ data: <SimpleChange>{ currentValue: journeys } });

    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    const linksEls = spectator.queryAll('.journey-search-grid__time');
    const link1 = `/vehicle-journeys/VJefdb0f42?startTime=${toQueryParamFormat(t1)}&operator=OP3&service=LI4728`;
    const link2 = `/vehicle-journeys/VJa921fcb5?startTime=${toQueryParamFormat(t5)}&operator=OP3&service=LI4728`;
    const link3 = `/vehicle-journeys/VJf3c22dad?startTime=${toQueryParamFormat(t2)}&operator=OP3&service=LI4728`;
    const link4 = `/vehicle-journeys/VJa3968321?startTime=${toQueryParamFormat(t3)}&operator=OP3&service=LI4728`;
    const link5 = `/vehicle-journeys/VJ4aa8804d?startTime=${toQueryParamFormat(t4)}&operator=OP3&service=LI4728`;

    expect(linksEls.length).toEqual(5);
    expect(linksEls[0].getAttribute('href')).toEqual(link1);
    expect(linksEls[1].getAttribute('href')).toEqual(link2);
    expect(linksEls[2].getAttribute('href')).toEqual(link3);
    expect(linksEls[3].getAttribute('href')).toEqual(link4);
    expect(linksEls[4].getAttribute('href')).toEqual(link5);
  });
});
