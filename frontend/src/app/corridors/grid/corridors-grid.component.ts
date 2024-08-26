import { Component, OnDestroy, OnInit } from '@angular/core';
import { ColDef, ComponentStateChangedEvent, ICellRendererParams } from 'ag-grid-community';
import { RouterLinkCellRendererComponent } from '../../shared/components/ag-grid/router-link-cell/router-link-cell.component';
import { Corridor, CorridorsService, CorridorSummary } from '../corridors.service';
import { distinctUntilChanged, finalize, map, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-corridors-grid',
  templateUrl: 'corridors-grid.component.html',
  styleUrls: ['./corridors-grid.component.scss'],
})
export class CorridorsGridComponent implements OnInit, OnDestroy {
  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      cellRenderer: RouterLinkCellRendererComponent,
      cellRendererParams: { routerLinkGetter: (params: ICellRendererParams) => [params.data.id] },
      comparator: (a, b) => a?.trim().localeCompare(b?.trim(), undefined, { numeric: true }),
      minWidth: 200,
      sort: 'asc',
      flex: 4,
      getQuickFilterText: ({ value }) => value,
      suppressNavigable: false,
      autoHeight: true,
      wrapText: true,
    },
    {
      field: 'numStops',
      headerName: 'Stops',
      flex: 1,
    },
    {
      cellRenderer: RouterLinkCellRendererComponent,
      cellRendererParams: {
        value: 'Edit',
        display: 'flex',
        flexDirection: 'row-reverse',
        routerLinkGetter: (params: ICellRendererParams) => ['edit/' + params.data.id],
      },
      suppressNavigable: false,
      sortable: false,
      flex: 1,
    },
  ];
  defaultColDef: ColDef = {
    sortable: true,
    unSortIcon: true,
    resizable: false,
    suppressNavigable: true,
    suppressMovable: true,
    getQuickFilterText: () => '',
  };

  data: CorridorSummary[] = [];
  gridFilter = '';
  loading = true;
  errored = false;
  noMatches = false;
  corridorForDeletion?: Corridor;

  constructor(private corridorsService: CorridorsService, private router: Router, private route: ActivatedRoute) {}

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.corridorsService
      .fetchCorridors()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.data = data),
        error: () => (this.errored = true),
      });

    this.route.queryParamMap
      .pipe(
        map((paramMap) => paramMap.get('search')),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((param) => {
        this.gridFilter = decodeURIComponent(param || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGridChanged({ api }: ComponentStateChangedEvent) {
    const rowCount = api.getDisplayedRowCount() ?? 0;
    this.noMatches = this.data.length > 0 && rowCount === 0;
  }

  onFilterChanged() {
    this.router.navigate([], {
      queryParams: {
        search: encodeURIComponent(this.gridFilter),
      },
      queryParamsHandling: 'merge',
    });
  }
}
