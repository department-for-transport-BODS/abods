import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { byText, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { PerformanceFiltersInputType } from 'src/generated/graphql';
import { dateTimeEqualityMatcher } from 'src/test-support/equality';
import { ControlsComponent } from './controls.component';
import { FiltersComponent } from '../filters/filters.component';
import { PanelService } from '../../shared/components/panel/panel.service';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { ChartNoDataWrapperComponent } from '../chart-no-data-wrapper/chart-no-data-wrapper.component';
import { DateTime } from 'luxon';
import objectContaining = jasmine.objectContaining;

describe('ControlsComponent', () => {
  let spectator: SpectatorRouting<ControlsComponent>;
  let component: ControlsComponent;
  let panelService: PanelService;

  const createComponent = createRoutingFactory({
    component: ControlsComponent,
    declarations: [FiltersComponent, ChartNoDataWrapperComponent],
    imports: [LayoutModule, SharedModule, FormsModule, ReactiveFormsModule, ApolloTestingModule],
    detectChanges: false,
    stubsEnabled: false,
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    panelService = spectator.inject(PanelService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to "timing points"', () => {
    let filters: PerformanceFiltersInputType | undefined;

    component.filtersSubject.subscribe((f) => (filters = f));

    spectator.setRouteParam('nocCode', 'OP01');

    expect(filters).toBeDefined();
    expect(filters?.timingPointsOnly).toBeTrue();
  });

  it('should allow the user to switch between all stops and timing points only', async () => {
    spyOn(spectator.router, 'navigate');
    spectator.setRouteParam('nocCode', 'OP01');

    spectator.click(byText('All stops'));
    spectator.detectChanges();

    expect(spectator.router.navigate).toHaveBeenCalledWith([], {
      queryParams: { allStops: true, timingPointsOnly: null },
      queryParamsHandling: 'merge',
    });
  });

  it('it should apply timing points filter from query string', () => {
    const spy = spyOn(component.params, 'emit');

    spectator.setRouteParam('nocCode', 'OP01');
    spectator.setRouteQueryParam('allStops', 'true');

    spectator.detectChanges();

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(spy).toHaveBeenCalled();

    const actual = spy.calls.mostRecent().args[0];

    expect(actual).toBeDefined();
    expect(actual?.filters?.timingPointsOnly).toBeUndefined();
  });

  it('should allow you to open the more filters panel', () => {
    spyOn(panelService, 'toggle');

    spectator.setRouteParam('nocCode', 'OP01');
    spectator.click(byText('Refine results'));

    expect(panelService.toggle).toHaveBeenCalledWith();
  });

  it('should apply more filters correctly to query string', () => {
    spyOn(spectator.router, 'navigate');

    spectator.setRouteParam('nocCode', 'OP01');

    const newFilters: PerformanceFiltersInputType = {
      dayOfWeekFlags: {
        monday: false,
        tuesday: false,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      startTime: '07:00',
      endTime: '10:59',
    };
    component.updateFilters(newFilters);

    expect(spectator.router.navigate).toHaveBeenCalledWith([], {
      queryParams: jasmine.objectContaining({
        dayOfWeek: 'wednesday,thursday,friday,saturday,sunday',
        startTime: '07:00',
        endTime: '10:59',
      }),
      queryParamsHandling: 'merge',
    });
  });

  it('should apply more filters correctly from query string', () => {
    spyOn(component.params, 'emit');

    spectator.setRouteParam('nocCode', 'OP01');
    spectator.setRouteQueryParam('dayOfWeek', 'wednesday,thursday,friday,saturday,sunday');
    spectator.setRouteQueryParam('startTime', '07:00');
    spectator.setRouteQueryParam('endTime', '10:59');

    spectator.detectChanges();

    expect(component.params.emit).toHaveBeenCalledWith(
      objectContaining({
        filters: objectContaining({
          dayOfWeekFlags: {
            monday: false,
            tuesday: false,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
          },
          startTime: '07:00',
          endTime: '10:59',
        }),
      })
    );
  });

  it('should request stats for dates and nocCode', () => {
    spyOn(component.params, 'emit');

    const operatorId = 'OP01';
    const nocCode = 'ABCD';
    const from = DateTime.fromObject({ year: 2021, month: 3, day: 30 });
    const to = DateTime.fromObject({ year: 2021, month: 4, day: 4 });

    spectator.setRouteParam('nocCode', nocCode);
    spectator.component.operatorId = operatorId;
    spectator.setRouteQueryParam('from', '2021-03-30');
    spectator.setRouteQueryParam('to', '2021-04-03');

    spectator.detectChanges();

    expect(component.params.emit).toHaveBeenCalledWith({
      fromTimestamp: from,
      toTimestamp: to,
      filters: {
        operatorIds: [operatorId],
        timingPointsOnly: true,
      },
    });
  });
});
