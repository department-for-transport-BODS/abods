import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { byRole, byText, createRoutingFactory, SpectatorRouting, SpyObject } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { dateTimeEqualityMatcher } from 'src/test-support/equality';
import { of } from 'rxjs';
import { ViewOperatorComponent } from './view-operator.component';
import { OnTimeService, PunctualityOverview } from '../on-time.service';
import { FiltersComponent } from '../filters/filters.component';
import { ChartNoDataWrapperComponent } from '../chart-no-data-wrapper/chart-no-data-wrapper.component';
import { ControlsComponent } from '../controls/controls.component';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { Operator, OperatorService } from '../../shared/services/operator.service';
import { TabsComponent } from '../../shared/components/tabs/tabs.component';
import { waitForAsync } from '@angular/core/testing';

describe('ViewOperatorComponent', () => {
  let spectator: SpectatorRouting<ViewOperatorComponent>;
  let component: ViewOperatorComponent;
  let operatorService: SpyObject<OperatorService>;
  let onTimeService: SpyObject<OnTimeService>;

  const mockOperator: Operator = { nocCode: 'OP01', name: 'Operator 1', adminAreaIds: [] };

  const createComponent = createRoutingFactory({
    component: ViewOperatorComponent,
    declarations: [FiltersComponent, ChartNoDataWrapperComponent, ControlsComponent, TabsComponent],
    imports: [LayoutModule, SharedModule, FormsModule, ReactiveFormsModule, ApolloTestingModule],
    mocks: [OperatorService, OnTimeService],
    detectChanges: false,
    stubsEnabled: false,
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    operatorService = spectator.inject(OperatorService);
    onTimeService = spectator.inject(OnTimeService);

    operatorService.fetchOperators.and.returnValue(of([mockOperator]));
    operatorService.fetchOperator.and.returnValue(of(mockOperator));
    onTimeService.fetchOnTimeStats.and.returnValue(
      of({
        completed: 0,
        scheduled: 100,
      } as PunctualityOverview)
    );
  });

  describe('Operator 1', () => {
    it('should create', () => {
      spectator.setRouteParam('nocCode', 'OP01');

      expect(component).toBeTruthy();
    });

    it('should show operator selector on service list page', () => {
      spectator.setRouteParam('nocCode', 'OP01');
      spectator.detectChanges();

      expect(spectator.query(byRole('combobox'))).toBeVisible();
      expect(spectator.query(byText('Operator 1 (OP01)'))).toBeVisible();
    });

    it('should not show operator not found message if operator exists', () => {
      spectator.setRouteParam('nocCode', 'OP01');

      expect(spectator.query(byText(/Not found/))).not.toBeVisible();
    });

    it('should display no timetabled error message', () => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        of({
          completed: 0,
          scheduled: 0,
        } as PunctualityOverview)
      );

      const nocCode = 'OP01';

      spectator.setRouteParam('nocCode', nocCode);

      spectator.detectChanges();

      expect(
        spectator.query(byText(/We have not found any timetable data for the time period and filters selected\./))
      ).toBeVisible();
    });

    it('should display no data error message', () => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        of({
          completed: 0,
          scheduled: 100,
        } as PunctualityOverview)
      );

      const nocCode = 'OP01';

      spectator.setRouteParam('nocCode', nocCode);

      spectator.detectChanges();

      expect(
        spectator.query(
          byText(/We have not received any vehicle location data for the time period and filters selected\./)
        )
      ).toBeVisible();
    });
  });

  describe('tabs', () => {
    beforeEach(() => {
      spectator.setRouteParam('nocCode', 'OP01');
      spectator.detectChanges();
    });

    it('should default to Timeline tab if no tab queryParam passed', () => {
      expect(spectator.query('.on-time__otp-chart')).toBeTruthy();
      expect(spectator.query('.on-time__dow-chart')).toBeFalsy();
    });

    it(
      'should show tab that passed by queryParam',
      waitForAsync(() => {
        spectator.setRouteQueryParam('tab', 'day-of-week');
        spectator.fixture.whenStable().then(() => {
          spectator.detectChanges();

          expect(spectator.query('.on-time__dow-chart')).toBeTruthy();
          expect(spectator.query('.on-time__otp-chart')).toBeFalsy();
        });
      })
    );
  });
});
