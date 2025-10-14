import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { createRoutingFactory, SpectatorRouting } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { MockProvider } from "ng-mocks";
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { of, throwError } from "rxjs";
import { dateTimeEqualityMatcher } from "src/test-support/equality";
import { LayoutModule } from "../../layout/layout.module";
import { OperatorService } from "../../shared/services/operator.service";
import { SharedModule } from "../../shared/shared.module";
import { AdminAreaMapComponent } from "../admin-area/admin-area-map.component";
import { ChartNoDataWrapperComponent } from "../chart-no-data-wrapper/chart-no-data-wrapper.component";
import { ControlsComponent } from "../controls/controls.component";
import { FilterChipsComponent } from "../filter-chips/filter-chips.component";
import { FiltersComponent } from "../filters/filters.component";
import { OnTimeService } from "../on-time.service";
import { OperatorGridComponent } from "../operator-grid/operator-grid.component";
import { SparklineFactoryComponent } from "../operator-grid/sparkline-factory/sparkline-factory.component";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import { OtpThresholdModalLinkComponent } from "../otp-threshold-modal-link/otp-threshold-modal-link.component";
import { OtpThresholdModalComponent } from "../otp-threshold-modal/otp-threshold-modal.component";
import { OverviewStatsComponent } from "../overview-stats/overview-stats.component";
import { AllOperatorsComponent } from "./all-operators.component";

fdescribe("AllOperatorsComponent", () => {
  let spectator: SpectatorRouting<AllOperatorsComponent>;
  let component: AllOperatorsComponent;
  let operatorService: OperatorService;

  const createComponent = createRoutingFactory({
    component: AllOperatorsComponent,
    declarations: [
      FiltersComponent,
      ChartNoDataWrapperComponent,
      ControlsComponent,
      OperatorGridComponent,
      FilterChipsComponent,
      AdminAreaMapComponent,
      OverviewStatsComponent,
      OtpThresholdModalLinkComponent,
      SparklineFactoryComponent,
      OtpThresholdModalComponent,
      OtpThresholdFormComponent,
    ],
    imports: [
      LayoutModule,
      SharedModule,
      FormsModule,
      ReactiveFormsModule,
      ApolloTestingModule,
      NgxMapboxGLModule,
      NgxTippyModule,
    ],
    providers: [
      MockProvider(OnTimeService, {
        fetchOnTimeStats: () => throwError(true),
      }),
    ],
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

    spyOn(operatorService, "fetchOperators").and.returnValue(
      of([
        {
          nocCode: "OP01",
          operatorId: "OP01",
          name: "Operator 1",
          adminAreaIds: [],
        },
      ]),
    );
    spyOn(operatorService, "fetchOperator").and.returnValue(
      of({
        nocCode: "OP01",
        operatorId: "OP01",
        name: "Operator 1",
        adminAreaIds: [],
      }),
    );
  });

  it("should create", async () => {
    spectator.setRouteParam("nocCode", "OP01");

    await expect(component).toBeTruthy();
  });
});
