import { createHostFactory, SpectatorHost } from '@ngneat/spectator';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { AgGridDomService } from './ag-grid-dom.service';
import { ColDef } from 'ag-grid-community';
import { Subject } from 'rxjs';
import { OperatorInfoType, ServicePerformanceType } from 'src/generated/graphql';

describe('AgGridDomService', () => {
  let spectator: SpectatorHost<AgGridAngular>;
  const createHost = createHostFactory({
    component: AgGridAngular,
    providers: [AgGridDomService],
    imports: [AgGridModule],
  });
  let service: AgGridDomService;
  const ready$ = new Subject<void>();

  const operatorInfo: OperatorInfoType = { nocCode: 'ABCD', operatorId: 'OP001', operatorName: 'Bus Company' };
  const data: ServicePerformanceType[] = [
    {
      lineId: 'M5P',
      lineInfo: {
        serviceId: '6',
        serviceName: 'Dispear to Wear',
        serviceNumber: '1A',
      },
      scheduledDepartures: 123,
      actualDepartures: 115,
      onTime: 80,
      early: 15,
      late: 20,
      averageDelay: 12,
      operatorInfo,
    },
    {
      lineId: 'TH',
      lineInfo: {
        serviceId: '7',
        serviceName: 'Roade to Nowerre',
        serviceNumber: '2A',
      },
      scheduledDepartures: 321,
      actualDepartures: 311,
      onTime: 300,
      early: 5,
      late: 6,
      averageDelay: 35,
      operatorInfo,
    },
  ];
  const cols: ColDef[] = [{ field: 'lineId' }, { field: 'scheduledDepartures' }, { field: 'actualDepartures' }];

  beforeEach(() => {
    spectator = createHost(
      `<ag-grid-angular [rowData]="data" [columnDefs]='cols' domLayout="autoHeight" (gridReady)='ready$.next()'></ag-grid-angular>`,
      {
        hostProps: { data, cols, ready$ },
      }
    );
    service = spectator.inject(AgGridDomService);
  });

  it('should get the viewport height', () => {
    spectator.detectChanges();

    // TODO {root:true} is a bit of a hack. Why the heck cant spectator see the element???
    expect(spectator.query('.ag-body-viewport', { root: true })).toExist();

    const actual = service.viewportHeight();

    expect(actual).toEqual(spectator.queryHost('.ag-body-viewport', { root: true })?.clientHeight);
  });
});
