import { VehicleJourneysSearchComponent } from "./vehicle-journeys-search.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../../shared/shared.module";
import {
  byLabel,
  byText,
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from "@ngneat/spectator";
import { DateTime, Settings } from "luxon";
import { SvgIconRegistryService } from "angular-svg-icon";
import { LayoutModule } from "../../layout/layout.module";
import { OperatorService } from "../../shared/services/operator.service";
import { NgSelectModule } from "@ng-select/ng-select";
import { Observable, of, throwError } from "rxjs";
import { VehicleJourneysSearchService } from "./vehicle-journeys-search.service";
import { LuxonModule } from "luxon-angular";
import { VehicleJourneysGridComponent } from "./vehicle-journeys-grid/vehicle-journeys-grid.component";
import { Journey, LineType, OperatorType } from "../../../generated/graphql";
import { RouterModule } from "@angular/router";

fdescribe("VehicleJourneysSearchComponent", () => {
  let spectator: SpectatorRouting<VehicleJourneysSearchComponent>;
  let vehicleJourneysSearchService: VehicleJourneysSearchService;

  const createComponent = createRoutingFactory({
    component: VehicleJourneysSearchComponent,
    imports: [
      SharedModule,
      LayoutModule,
      FormsModule,
      ReactiveFormsModule,
      NgSelectModule,
      LuxonModule,
      RouterModule.forRoot([]),
    ],
    declarations: [VehicleJourneysGridComponent],
    providers: [
      mockProvider(OperatorService, {
        searchOperators: (): Observable<OperatorType[]> =>
          of([
            {
              name: "Arriva Beds and Bucks",
              nocCode: "ARBB",
              operatorId: "OP01",
              adminAreaIds: [],
            },
            {
              name: "Stagecoach East",
              nocCode: "SCCM",
              operatorId: "OP02",
              adminAreaIds: [],
            },
            {
              name: "Preston Bus",
              nocCode: "OP328",
              operatorId: "OP03",
              adminAreaIds: [],
            },
          ]),
        fetchLines: (): Observable<LineType[]> =>
          of([
            {
              id: "LI4728",
              name: "Blackpool Town Centre - Lytham",
              number: "76",
              adminAreaIds: [],
            },
            {
              id: "LI6711",
              name: "Preston City Centre - Red Scar",
              number: "6",
              adminAreaIds: [],
            },
          ]),
      }),
      mockProvider(VehicleJourneysSearchService, {
        fetchDayJourneys: (): Observable<Journey[]> =>
          of([
            {
              groupId: "VJefdb0f42",
              startTime: DateTime.fromISO("2022-08-01T06:45:00", {
                zone: "Europe/London",
              }).toISO(),
              servicePattern: "St Annes - Blackpool Town Centre",
              lineNumber: "76",
              isCancelled: false,
              operatorName: "Arriva Beds and Bucks",
              operatorNoc: "ARBB",
              serviceName: "Blackpool Town Centre - Lytham",
              serviceNumber: "76",
            },
            {
              groupId: "VJf3c22dad",
              startTime: DateTime.fromISO("2022-08-01T06:55:00", {
                zone: "Europe/London",
              }).toISO(),
              servicePattern: "Poulton-le-Fylde - St Annes",
              lineNumber: "76",
              isCancelled: false,
              operatorName: "Arriva Beds and Bucks",
              operatorNoc: "ARBB",
              serviceName: "Blackpool Town Centre - Lytham",
              serviceNumber: "76",
            },
            {
              groupId: "VJa3968321",
              startTime: DateTime.fromISO("2022-08-01T07:28:00", {
                zone: "Europe/London",
              }).toISO(),
              servicePattern: "Blackpool Town Centre - St Annes",
              lineNumber: "76",
              isCancelled: false,
              operatorName: "Arriva Beds and Bucks",
              operatorNoc: "ARBB",
              serviceName: "Blackpool Town Centre - Lytham",
              serviceNumber: "76",
            },
            {
              groupId: "VJ4aa8804d",
              startTime: DateTime.fromISO("2022-08-01T15:38:00", {
                zone: "Europe/London",
              }).toISO(),
              servicePattern: "Blackpool Town Centre - St Annes",
              lineNumber: "76",
              isCancelled: false,
              operatorName: "Arriva Beds and Bucks",
              operatorNoc: "ARBB",
              serviceName: "Blackpool Town Centre - Lytham",
              serviceNumber: "76",
            },
            {
              groupId: "VJa921fcb5",
              startTime: DateTime.fromISO("2022-08-01T15:55:00", {
                zone: "Europe/London",
              }).toISO(),
              servicePattern: "St Annes - Blackpool Town Centre",
              lineNumber: "76",
              isCancelled: false,
              operatorName: "Arriva Beds and Bucks",
              operatorNoc: "ARBB",
              serviceName: "Blackpool Town Centre - Lytham",
              serviceNumber: "76",
            },
          ]),
      }),
    ],
    detectChanges: false,
    stubsEnabled: false,
    mocks: [SvgIconRegistryService],
  });

  beforeEach(() => {
    Settings.defaultZone = "utc";
    Settings.now = () => 1659312000000; // 2022-08-01

    spectator = createComponent();
    spectator.detectChanges();

    vehicleJourneysSearchService = spectator.inject(
      VehicleJourneysSearchService,
    );
  });

  it("should create", async () => {
    await expect(spectator.component).toBeTruthy();
  });

  it("should accept date input", async () => {
    spectator.typeInElement("2022-07-10", byLabel("Date"));
    spectator.fixture.detectChanges();

    await expect(spectator.component.date?.value).toEqual(
      DateTime.fromISO("2022-07-10"),
    );
    expect(spectator.component.date?.valid).toBeTrue();
  });

  it("should not accept invalid date input", async () => {
    spectator.typeInElement("2021-12-25", byLabel("Date"));
    spectator.fixture.detectChanges();

    expect(spectator.component.date?.invalid).toBeTrue();
    // Defensive: check errors is not null before accessing property
    const errors = spectator.component.date?.errors;
    await expect(errors).toBeTruthy();
    expect(errors?.dateWithinRange).toBeTrue();
  });

  it("should accept operator input", async () => {
    // Set a valid date first, as required by the form
    spectator.typeInElement("2022-07-10", byLabel("Date"));
    spectator.fixture.detectChanges();

    spectator.typeInElement("Stagecoach", 'input[id="operator"]');
    spectator.click(byText("Stagecoach East (OP02)"));

    await expect(spectator.component.form.get("operator")?.value).toEqual(
      "OP02",
    );
  });

  it("should not accept line input until an operator is selected", async () => {
    await spectator.fixture.whenRenderingDone();

    expect("#service").toBeDisabled();
  });

  it("should accept line input once an operator is selected", async () => {
    spectator.typeInElement("Preston", 'input[id="operator"]');
    spectator.click(byText("Preston Bus (OP03)"));

    // Need to manually set query param to trigger fetchLines
    spectator.setRouteQueryParam("operator", "OP03");

    spectator.typeInElement("Blackpool", 'input[id="service"]');
    spectator.click(byText("76: Blackpool Town Centre - Lytham"));
    spectator.fixture.detectChanges();

    await expect(spectator.component.form.get("service")?.value).toEqual(
      "LI4728",
    );
  });

  it("should show previous and next links when journeys loading", () => {
    spectator.fixture.autoDetectChanges();

    spectator.typeInElement("2022-07-10", byLabel("Date"));

    spectator.typeInElement("Preston", 'input[id="operator"]');
    spectator.click(byText("Preston Bus (OP03)"));

    // Need to manually set query param to trigger fetchLines
    spectator.setRouteQueryParam("operator", "OP03");

    spectator.typeInElement("Blackpool", 'input[id="service"]');
    spectator.click(byText("76: Blackpool Town Centre - Lytham"));

    expect(spectator.query(byText("Next"))).toBeVisible();
    expect(spectator.query(byText("Previous"))).toBeVisible();
  });

  it("should not show next link on todays date", () => {
    spectator.fixture.autoDetectChanges();

    spectator.typeInElement("Preston", byLabel("Operator"));
    spectator.click(byText("Preston Bus (OP03)"));

    // Need to manually set query param to trigger fetchLines
    spectator.setRouteQueryParam("operator", "OP03");

    spectator.typeInElement("Blackpool", byLabel("Service name"));
    spectator.click(byText("76: Blackpool Town Centre - Lytham"));

    expect(spectator.query(byText("Next"))).not.toBeVisible();
    expect(spectator.query(byText("Previous"))).toBeVisible();
  });

  it("should not show previous link when not in valid range", () => {
    spectator.fixture.autoDetectChanges();

    spectator.typeInElement(
      spectator.component.validDateRange.start
        .plus({ days: 1 })
        .toFormat("yyyy-MM-dd"),
      byLabel("Date"),
    );

    spectator.typeInElement("Preston", byLabel("Operator"));
    spectator.click(byText("Preston Bus (OP03)"));

    // Need to manually set query param to trigger fetchLines
    spectator.setRouteQueryParam("operator", "OP03");

    spectator.typeInElement("Blackpool", byLabel("Service name"));
    spectator.click(byText("76: Blackpool Town Centre - Lytham"));

    expect(spectator.query(byText("Next"))).toBeVisible();
    expect(spectator.query(byText("Previous"))).not.toBeVisible();
  });

  it("should show all vehicle journey start times", async () => {
    spectator.fixture.autoDetectChanges();
    spectator.typeInElement("2022-07-10", byLabel("Date"));

    spectator.typeInElement("Preston", byLabel("Operator"));
    spectator.click(byText("Preston Bus (OP03)"));

    // Need to manually set query param to trigger fetchLines
    spectator.setRouteQueryParam("operator", "OP03");

    await spectator.fixture.whenStable();
    spectator.typeInElement("Blackpool", byLabel("Service name"));
    spectator.click(byText("76: Blackpool Town Centre - Lytham"));

    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    expect(
      spectator.query(byText("76: Blackpool Town Centre - Lytham")),
    ).toBeVisible();

    expect(spectator.query(byText("06:45"))).toBeVisible();
    expect(spectator.query(byText("15:55"))).toBeVisible();
    expect(spectator.query(byText("06:55"))).toBeVisible();
    expect(spectator.query(byText("07:28"))).toBeVisible();
    expect(spectator.query(byText("15:38"))).toBeVisible();
  });

  it("should set all fields from route query params", async () => {
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    spectator.setRouteQueryParam("date", "20220701T0000Z");

    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    await spectator.fixture.whenStable();

    await expect(spectator.component.date.value).toEqual(
      DateTime.fromISO("2022-07-01T00:00:00"),
    );
    await expect(spectator.component.operator.value).toEqual("OP03");
    await expect(spectator.component.service.value).toEqual("LI4728");
  });

  it("should load journeys from route query params", async () => {
    spectator.fixture.autoDetectChanges();

    spectator.setRouteQueryParam("date", "20220801T2300Z");
    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    expect(
      spectator.query(byText("76: Blackpool Town Centre - Lytham")),
    ).toBeVisible();
    expect(spectator.query(byText("06:45"))).toBeVisible();
    expect(spectator.query(byText("15:55"))).toBeVisible();
  });

  it("should show no journeys found message", async () => {
    spyOn(vehicleJourneysSearchService, "fetchDayJourneys").and.returnValue(
      of([]),
    );

    spectator.fixture.autoDetectChanges();

    spectator.setRouteQueryParam("date", "20220801T2300Z");
    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    await spectator.fixture.whenStable();

    expect(spectator.query(byText("No journeys found"))).toBeVisible();
  });

  it("should show error message", async () => {
    spyOn(vehicleJourneysSearchService, "fetchDayJourneys").and.returnValue(
      throwError(() => "error"),
    );

    spectator.fixture.autoDetectChanges();

    spectator.setRouteQueryParam("date", "20220801T2300Z");
    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    await spectator.fixture.whenStable();

    expect(
      spectator.query(
        byText(
          "Sorry, there is a problem finding vehicle journeys. Please try again.",
        ),
      ),
    ).toBeVisible();
  });

  it("should accept enable service on date change", async () => {
    await spectator.fixture.whenStable();
    spectator.typeInElement("2024-10-24", byLabel("Date"));
    spectator.typeInElement("Stagecoach", byLabel("Operator"));
    spectator.click(byText("Stagecoach East (OP02)"));
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.form.get("operator")?.value).toEqual("OP02");
    spectator.typeInElement("2024-10-23", byLabel("Date"));
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.service.value).toBeNull();
    expect("#service").toBeVisible();
  });

  it("should reset service on operator change", async () => {
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    spectator.setRouteQueryParam("date", "20220701T0000Z");
    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    await spectator.fixture.whenStable();

    spectator.setRouteQueryParam("operator", "OP02");
    await spectator.fixture.whenStable();
    expect(spectator.component.service.value).toBeNull();
    await expect(spectator.component.operator.value).toEqual("OP02");
  });

  it("should load journeys when date string is passed", async () => {
    spectator.fixture.autoDetectChanges();

    spectator.setRouteQueryParam("date", "2022-08-01");
    spectator.setRouteQueryParam("operator", "OP03");
    spectator.setRouteQueryParam("service", "LI4728");

    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    expect(
      spectator.query(byText("76: Blackpool Town Centre - Lytham")),
    ).toBeVisible();
    expect(spectator.query(byText("06:45"))).toBeVisible();
    expect(spectator.query(byText("15:55"))).toBeVisible();
  });
});
