import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagingPanelComponent } from './paging-panel.component';
import { GridApi, PaginationChangedEvent } from 'ag-grid-community';

describe('PagingPanelComponent', () => {
  let component: PagingPanelComponent;
  let fixture: ComponentFixture<PagingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagingPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should only update from AG-Grid events, not from the Angular lifecycle', () => {
    let rowCount = 78;
    const api = {
      paginationGetPageSize: () => 10,
      paginationGetCurrentPage: () => 1,
      paginationGetTotalPages: () => 4,
      paginationGetRowCount: () => rowCount,
    } as GridApi;

    const event = { api: api as GridApi } as PaginationChangedEvent;
    component.paginationChanged(event);

    expect(component.rowCount).toEqual(78);

    rowCount = 20;

    expect(component.rowCount).toEqual(78);

    component.paginationChanged(event);

    expect(component.rowCount).toEqual(20);
  });
});
