import { CorridorsModule } from '../corridors.module';
import { byLabel, byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { CorridorsService } from '../corridors.service';
import { of, throwError } from 'rxjs';
import { CorridorsGridComponent } from './corridors-grid.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { AgGridModule } from 'ag-grid-angular';

const queryCell = (spectator: Spectator<CorridorsGridComponent>) =>
  spectator.query('[role="row"][row-index="0"] [role="gridcell"][col-id="numStops"]')?.textContent;

describe('CorridorsGridComponent', () => {
  let spectator: Spectator<CorridorsGridComponent>;
  let component: CorridorsGridComponent;
  let service: CorridorsService;
  let spy: jasmine.Spy;

  const createComponent = createComponentFactory({
    component: CorridorsGridComponent,
    imports: [CorridorsModule, SharedModule, LayoutModule, RouterTestingModule, ApolloTestingModule, AgGridModule],
  });

  beforeEach(async () => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(CorridorsService);
  });

  it('should fetch corridors', () => {
    spy = spyOn(service, 'fetchCorridors').and.returnValue(of([{ id: 1, name: 'My test corridor', numStops: 3 }]));
    component.ngOnInit();
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith();

    const cellContent = queryCell(spectator);

    expect(cellContent).toEqual('3');
  });

  it('should show error message if corridor query returns an error', () => {
    spy = spyOn(service, 'fetchCorridors').and.returnValue(throwError(() => 'error'));
    component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.query(byText('There was an error loading operator data, please try again.'))).toBeVisible();
  });

  it('should filter table', () => {
    spyOn(service, 'fetchCorridors').and.returnValue(of([{ id: 1, name: 'My test corridor', numStops: 3 }]));
    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('test', byLabel('Search for a corridor'));
    spectator.detectChanges();

    const cellContent = queryCell(spectator);

    expect(cellContent).toEqual('3');
  });

  it('should show no match message if no results found', async () => {
    spyOn(service, 'fetchCorridors').and.returnValue(of([{ id: 1, name: 'My test corridor', numStops: 3 }]));
    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('nope', byLabel('Search for a corridor'));
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('No corridors matched the search query.'))).toBeVisible();
  });

  it('should not show no message if no corridor data', async () => {
    spyOn(service, 'fetchCorridors').and.returnValue(of([]));
    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement('nope', byLabel('Search for a corridor'));
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('No corridors matched the search query.'))).not.toBeVisible();
  });
});
