import { DecimalPipe } from "@angular/common";
import {
  byText,
  byTextContent,
  createComponentFactory,
  Spectator,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";
import { PunctualityOverview } from "../on-time.service";

import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LuxonModule } from "luxon-angular";
import { NgxTippyDirective } from "ngx-tippy-wrapper";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import { OtpThresholdModalLinkComponent } from "../otp-threshold-modal-link/otp-threshold-modal-link.component";
import { OtpThresholdModalComponent } from "../otp-threshold-modal/otp-threshold-modal.component";
import { OverviewStatsComponent } from "./overview-stats.component";

describe("OverviewStatsComponent", () => {
  let spectator: Spectator<OverviewStatsComponent>;
  let component: OverviewStatsComponent;

  const createComponent = createComponentFactory({
    component: OverviewStatsComponent,
    imports: [
      SharedModule,
      LayoutModule,
      ApolloTestingModule,
      RouterModule.forRoot([]),
      LuxonModule,
      ReactiveFormsModule,
    ],
    declarations: [
      OtpThresholdModalLinkComponent,
      NgxTippyDirective,
      OtpThresholdModalComponent,
      OtpThresholdFormComponent,
    ],
    providers: [DecimalPipe],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it("should create", async () => {
    spectator.detectChanges();

    await expect(component).toBeTruthy();
  });

  const stats: PunctualityOverview = {
    onTime: 283250,
    late: 153750,
    early: 63000,
    noData: 9864,
    completed: 500000,
    scheduled: 509864,
    incomplete: "9864",
    averageDelay: 5.25,
  };

  it("should display on-time percentage", async () => {
    const expected = "56.65%";

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    await expect(
      spectator.query(
        byTextContent(expected, {
          selector: "#on-time-overview-stat-on-time .stat__value",
        }),
      ),
    ).toBeTruthy();
  });

  it("should display late percentage", async () => {
    const expected = "30.75%";

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    await expect(
      spectator.query(
        byTextContent(expected, {
          selector: "#on-time-overview-stat-late .stat__value",
        }),
      ),
    ).toBeTruthy();
  });

  it("should display early percentage", async () => {
    const expected = "12.6%";

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    await expect(
      spectator.query(
        byTextContent(expected, {
          selector: "#on-time-overview-stat-early .stat__value",
        }),
      ),
    ).toBeTruthy();
  });

  it("should display no-data percentage", async () => {
    const expected = "1.93%";

    component.overview = stats;
    component.loading = false;

    spectator.detectChanges();

    await expect(
      spectator.query(
        byTextContent(expected, {
          selector: "#on-time-overview-stat-no-data .stat__value",
        }),
      ),
    ).toBeTruthy();
  });

  it("should not display excess wait time when not specified", () => {
    component.loading = false;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent("Excess wait time", { selector: ".stat__label" }),
      ),
    ).not.toBeVisible();
  });

  it("should display excess wait time when specified", () => {
    component.headwayOverview = {
      excess: 1.5,
    };
    component.loading = false;
    component.frequent = true;

    spectator.detectChanges();

    expect(spectator.query(byText("Excess wait time"))).toBeVisible();
    expect(spectator.query(byText("1:30"))).toBeVisible();
  });
});
