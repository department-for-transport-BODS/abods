import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { RankingOrder, ServicePunctualityType } from 'src/generated/graphql';
import { fakeDashboardServiceRanking } from 'src/test-support/faker';

import { PerformanceRankingComponent } from './ranking-table.component';
import * as faker from 'faker';
import { DateTime } from 'luxon';
import { ChangeComponent } from 'src/app/shared/components/change/change.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { LayoutModule } from 'src/app/layout/layout.module';
import { RouterTestingModule } from '@angular/router/testing';
import { Period } from 'src/app/shared/components/date-range/date-range.types';

describe('PerformanceRankingComponent', () => {
  let spectator: Spectator<PerformanceRankingComponent>;
  let component: PerformanceRankingComponent;

  const createComponent = createComponentFactory({
    component: PerformanceRankingComponent,
    declarations: [ChangeComponent],
    imports: [SharedModule, LayoutModule, RouterTestingModule],
    detectChanges: false,
  });

  beforeAll(() => {
    faker.seed(54545);
  });

  beforeEach(() => {
    spectator = createComponent();

    component = spectator.component;
  });

  const services: ServicePunctualityType[] = [
    fakeDashboardServiceRanking({ nocCode: 'OP01' }),
    fakeDashboardServiceRanking({ nocCode: 'OP02' }),
    fakeDashboardServiceRanking({ nocCode: 'OP02' }),
  ];

  const operators: { nocCode: string; name?: string | null }[] = [
    {
      nocCode: 'OP01',
      name: 'Operator 1',
    },
    {
      nocCode: 'OP02',
      name: 'Operator 2',
    },
  ];

  beforeEach(() => {
    const now = DateTime.local();
    component.services = services;
    component.operators = operators;
    component.loaded = true;
    component.period = Period.Last28;
    component.fromTo = {
      to: now,
      from: now.minus({ days: 28 }),
      trendFrom: now.minus({ days: 56 }),
      trendTo: now.minus({ days: 28 }),
      preset: Period.Last28,
    };
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should emit change order events', () => {
    spectator.detectChanges();

    const outputSpy = spyOn(component.orderChanged, 'emit');

    spectator.click(byText('Bottom 3'));

    expect(outputSpy).toHaveBeenCalledWith(RankingOrder.Ascending);

    outputSpy.calls.reset();

    spectator.click(byText('Top 3'));

    expect(outputSpy).toHaveBeenCalledWith(RankingOrder.Descending);
  });

  it('should display service name and line in table', () => {
    spectator.detectChanges();

    const serviceNames = spectator.queryAll('.ranking-table__service').map((r) => r.textContent);

    expect(serviceNames).toEqual(
      jasmine.arrayWithExactContents(
        services.map(({ lineInfo: { serviceNumber, serviceName } }) => `${serviceNumber}: ${serviceName}`)
      )
    );
  });

  it('should display operator name in table', () => {
    spectator.detectChanges();

    const operatorCodes = spectator.queryAll('.ranking-table__operator').map((r) => r.textContent);

    expect(operatorCodes).toEqual(jasmine.arrayWithExactContents(['Operator 1', 'Operator 2', 'Operator 2']));
  });
});
