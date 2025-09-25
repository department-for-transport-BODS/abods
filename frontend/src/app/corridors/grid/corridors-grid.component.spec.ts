import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  byLabel,
  byText,
  createComponentFactory,
  Spectator,
} from "@ngneat/spectator";
import { AgGridModule } from "ag-grid-angular";
import { ComponentStateChangedEvent } from "ag-grid-community";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of, throwError } from "rxjs";
import { LayoutModule } from "../../layout/layout.module";
import { GdsModule } from "../../shared/gds/gds.module";
import { SharedModule } from "../../shared/shared.module";
import { CorridorsModule } from "../corridors.module";
import { CorridorsService } from "../corridors.service";
import { CorridorsGridComponent } from "./corridors-grid.component";

const queryCell = (spectator: Spectator<CorridorsGridComponent>) =>
  spectator.query(
    '[role="row"][row-index="0"] [role="gridcell"][col-id="numStops"]',
  )?.textContent;

fdescribe("CorridorsGridComponent", () => {
  let spectator: Spectator<CorridorsGridComponent>;
  let component: CorridorsGridComponent;
  let service: CorridorsService;
  let router: Router;
  let spy: jasmine.Spy;

  const createComponent = createComponentFactory({
    component: CorridorsGridComponent,
    imports: [
      CorridorsModule,
      SharedModule,
      LayoutModule,
      RouterModule.forRoot([]),
      ApolloTestingModule,
      AgGridModule,
      ReactiveFormsModule,
      FormsModule,
      GdsModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(CorridorsService);
    router = spectator.inject(Router);

    spyOn(router, "navigate").and.resolveTo(true);
  });

  it("should fetch corridors", async () => {
    spy = spyOn(service, "fetchCorridors").and.returnValue(
      of([{ id: 1, name: "My test corridor", numStops: 3 }]),
    );
    component.ngOnInit();
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith();

    const cellContent = queryCell(spectator);

    await expect(cellContent).toEqual("3");
  });

  it("should show error message if corridor query returns an error", () => {
    spy = spyOn(service, "fetchCorridors").and.returnValue(
      throwError(() => "error"),
    );
    component.ngOnInit();
    spectator.detectChanges();

    expect(
      spectator.query(
        byText("There was an error loading operator data, please try again."),
      ),
    ).toBeVisible();
  });

  it("should filter table", async () => {
    spyOn(service, "fetchCorridors").and.returnValue(
      of([
        { id: 1, name: "My test corridor", numStops: 3 },
        { id: 2, name: "Another corridor", numStops: 5 },
      ]),
    );
    component.ngOnInit();
    spectator.detectChanges();

    spectator.typeInElement("test", byLabel("Search for a corridor"));
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const cellContent = queryCell(spectator);

    await expect(cellContent).toEqual("3");
  });

  it("should show no match message if no results found", async () => {
    spyOn(service, "fetchCorridors").and.returnValue(
      of([{ id: 1, name: "My test corridor", numStops: 3 }]),
    );
    component.ngOnInit();
    spectator.detectChanges();

    component.onGridChanged({
      api: { getDisplayedRowCount: () => 0 },
    } as ComponentStateChangedEvent);
    spectator.detectChanges();

    expect(
      spectator.query(byText("No corridors matched the search query.")),
    ).toBeVisible();

    await expect(component.noMatches).toBe(true);
  });

  it("should not show no message if no corridor data", async () => {
    spyOn(service, "fetchCorridors").and.returnValue(of([]));
    component.ngOnInit();
    spectator.detectChanges();

    component.onGridChanged({
      api: { getDisplayedRowCount: () => 0 },
    } as ComponentStateChangedEvent);
    spectator.detectChanges();

    expect(
      spectator.query(byText("No corridors matched the search query.")),
    ).not.toBeVisible();

    await expect(component.noMatches).toBe(false);
  });
});
