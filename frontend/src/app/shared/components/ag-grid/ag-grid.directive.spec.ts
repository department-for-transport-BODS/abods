import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';
import { Component } from '@angular/core';
import { AgGridDirective } from './ag-grid.directive';
import { AgGridFormatterService } from './ag-grid-formatter.service';
import { GridApi, ColumnApi } from 'ag-grid-community';
import { MockProvider } from 'ng-mocks';

@Component({ template: `<ag-grid-angular appAgGrid></ag-grid-angular>` })
class HostComponent {}

describe('AgGridDirective', () => {
  let spectator: SpectatorDirective<AgGridDirective, HostComponent>;
  let mockGridApi: GridApi;
  let mockColumnApi: ColumnApi;

  const createDirective = createDirectiveFactory({
    directive: AgGridDirective,
    host: HostComponent,
    providers: [MockProvider(AgGridFormatterService)],
  });

  beforeEach(() => {
    mockGridApi = ({ exportDataAsCsv: jasmine.createSpy() } as unknown) as GridApi;
    mockColumnApi = {} as ColumnApi;

    spectator = createDirective(`<ag-grid-angular appAgGrid></ag-grid-angular>`);
  });

  it('should be defined', () => {
    expect(spectator.directive).toBeDefined();
  });

  it('should initialize grid api and column api', () => {
    const agGridEvent = { api: mockGridApi, columnApi: mockColumnApi, type: 'gridReady' } as any;

    spectator.directive.gridReady(agGridEvent);

    expect(spectator.directive.gridApi).toBe(mockGridApi);
    expect(spectator.directive.columnApi).toBe(mockColumnApi);
  });

  it('should call exportDataAsCsv with the correct parameters', () => {
    spectator.directive.gridApi = mockGridApi;
    const filename = 'filename';
    spectator.directive.export(filename);

    expect(mockGridApi.exportDataAsCsv).toHaveBeenCalledWith(jasmine.any(Object));
  });
});
