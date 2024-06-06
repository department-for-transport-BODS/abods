import { Spectator, SpyObject, byLabel, byText, createComponentFactory, mockProvider } from '@ngneat/spectator';
import { OperatorGridComponent } from './operator-grid.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { AgGridModule } from 'ag-grid-angular';
import { OnTimeService, OperatorPerformance, PerformanceParams } from '../on-time.service';
import { of, throwError } from 'rxjs';
import { OnTimeModule } from '../on-time.module';
import { DateTime, Settings } from 'luxon';
import { Operator, OperatorService } from '../../shared/services/operator.service';
import { LayoutModule } from '../../layout/layout.module';

describe('OperatorGridComponent', () => {
  let spectator: Spectator<OperatorGridComponent>;
  let component: OperatorGridComponent;
  let onTimeService: SpyObject<OnTimeService>;
  let operatorService: SpyObject<OperatorService>;

  const mockOperators: Operator[] = [
    {
      name: 'A A Williams',
      nocCode: 'OP1',
      adminAreaIds: ['AA1', 'AA2'],
    },
    {
      name: 'First Leeds',
      nocCode: 'OP2',
      adminAreaIds: ['AA3'],
    },
    {
      name: 'D & G Buses',
      nocCode: 'OP3',
      adminAreaIds: [],
    },
  ];
  const mockOperatorOTP: OperatorPerformance[] = [
    {
      nocCode: 'OP1',
      name: 'A A Williams',
      early: 10,
      onTime: 70,
      late: 20,
      total: 100,
      onTimeRatio: 0.7,
      earlyRatio: 0.1,
      lateRatio: 0.2,
      completedRatio: 1,
    },
    {
      nocCode: 'OP2',
      name: 'First Leeds',
      early: 0,
      onTime: 100,
      late: 0,
      total: 100,
      onTimeRatio: 1,
      earlyRatio: 0,
      lateRatio: 0,
      completedRatio: 1,
    },
    {
      nocCode: 'OP3',
      name: 'D & G Buses',
      early: 0,
      onTime: 90,
      late: 10,
      total: 100,
      onTimeRatio: null,
      earlyRatio: null,
      lateRatio: null,
      completedRatio: null,
    },
  ];
  let mockParams: PerformanceParams;

  const createComponent = createComponentFactory({
    component: OperatorGridComponent,
    imports: [OnTimeModule, SharedModule, LayoutModule, RouterTestingModule, ApolloTestingModule, AgGridModule],
    providers: [mockProvider(OnTimeService), mockProvider(OperatorService)],
    detectChanges: false,
  });

  beforeEach(async () => {
    Settings.defaultZone = 'Europe/London';
    Settings.now = () => 1664578800; // 2022-10-01 GMT+01:00, i.e. during BST
    mockParams = {
      fromTimestamp: DateTime.now(),
      toTimestamp: DateTime.now().plus({ days: 7 }),
      filters: { adminAreaIds: [] },
    };

    spectator = createComponent();
    component = spectator.component;

    onTimeService = spectator.inject(OnTimeService);
    operatorService = spectator.inject(OperatorService);

    operatorService.fetchOperators.and.returnValue(of(mockOperators));
    onTimeService.fetchOnTimeTimeSeriesData.and.returnValue(of([]));
    component.params = mockParams;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch corridors', () => {
    const spy = onTimeService.fetchOperatorPerformanceList.and.returnValue(of(mockOperatorOTP));
    onTimeService.fetchOnTimeTimeSeriesData.and.returnValue(of([]));
    component.ngOnInit();
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(mockParams);
  });

  it('should show error message', () => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(throwError(() => 'error'));
    component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.query(byText('There was an error loading operator data, please try again.'))).toBeVisible();
  });

  it('should search for operators and ignore white space if single character including & symbol', async () => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(of(mockOperatorOTP));

    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('AA Williams', byLabel('Search for an operator'));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('A A Williams'))).toBeVisible();
    expect(spectator.query(byText('First Leeds'))).not.toBeVisible();
    expect(spectator.query(byText('D & G Buses'))).not.toBeVisible();

    spectator.typeInElement('D&G', byLabel('Search for an operator'));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('A A Williams'))).not.toBeVisible();
    expect(spectator.query(byText('First Leeds'))).not.toBeVisible();
    expect(spectator.query(byText('D & G Buses'))).toBeVisible();
  });

  it('should search for operators and ignore order of words', async () => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(of(mockOperatorOTP));

    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('Leeds First', byLabel('Search for an operator'));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('A A Williams'))).not.toBeVisible();
    expect(spectator.query(byText('First Leeds'))).toBeVisible();
    expect(spectator.query(byText('D & G Buses'))).not.toBeVisible();
  });

  it('should show no operators found message', async () => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(of(mockOperatorOTP));

    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('zzz', byLabel('Search for an operator'));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('No operators matched the search query'))).toBeVisible();
  });
});
