import { HttpClient } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import {
  byText,
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { SvgIconRegistryService } from "angular-svg-icon";
import { DateTime, Settings } from "luxon";
import { NgxSmartModalModule, NgxSmartModalService } from "ngx-smart-modal";
import { of, throwError } from "rxjs";
import { ConfigService } from "../../config/config.service";
import { SharedModule } from "../../shared/shared.module";
import { OnTimeService, PerformanceParams } from "../on-time.service";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import {
  OTP_THRESHOLD_MODAL_ID,
  OtpThresholdModalComponent,
  OtpThresholdModalData,
} from "./otp-threshold-modal.component";

fdescribe("OtpThresholdModalComponent", () => {
  let spectator: Spectator<OtpThresholdModalComponent>;
  let component: OtpThresholdModalComponent;
  let ngxSmartModalService: NgxSmartModalService;
  let onTimeService: SpyObject<OnTimeService>;

  const modalData: OtpThresholdModalData = {
    params: {
      fromTimestamp: DateTime.now().toISO().toString(),
      toTimestamp: DateTime.now().plus({ days: 1 }).toISO().toString(),
      filters: {},
    },
    defaultValues: {
      early: 10,
      late: 20,
      onTime: 70,
      completed: 100,
    },
  } as OtpThresholdModalData;

  const createComponent = createComponentFactory({
    component: OtpThresholdModalComponent,
    declarations: [OtpThresholdFormComponent],
    mocks: [SvgIconRegistryService, HttpClient, OnTimeService],
    providers: [ConfigService],
    imports: [NgxSmartModalModule, SharedModule, ReactiveFormsModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    ngxSmartModalService = spectator.inject(NgxSmartModalService);
    onTimeService = spectator.inject(OnTimeService);
    onTimeService.fetchOnTimeStats.and.returnValue(
      of({
        completed: 10,
        early: 10,
        incomplete: "5",
        late: 20,
        onTime: 6,
        scheduled: 40,
        noData: 7,
      }),
    );
    Settings.now = () => 1630494000000; // 2021-09-01T12:00:00
    ngxSmartModalService.setModalData(modalData, OTP_THRESHOLD_MODAL_ID, true);
    ngxSmartModalService.open(OTP_THRESHOLD_MODAL_ID);
    spectator.detectChanges();
  });

  it("should create the component", async () => {
    await expect(component).toBeTruthy();
  });

  it("should show default percentages on modal opening", async () => {
    await expect(component.tableData.onTime.defaultValue).toEqual(0.7);
    await expect(component.tableData.early.defaultValue).toEqual(0.1);
    await expect(component.tableData.late.defaultValue).toEqual(0.2);
    expect(spectator.query(byText("70%"))).toBeVisible();
    expect(spectator.query(byText("20%"))).toBeVisible();
    expect(spectator.query(byText("10%"))).toBeVisible();
  });

  it("should call fetchOnTimeStats on compare with default values", () => {
    spectator.click(byText("Compare"));

    const expected: PerformanceParams = {
      fromTimestamp: modalData.params?.fromTimestamp ?? "",
      toTimestamp: modalData.params?.toTimestamp ?? "",
      filters: {
        ...modalData.params?.filters,
        onTimeMaxMinutes: 6,
        onTimeMinMinutes: -1,
      },
    };

    expect(onTimeService.fetchOnTimeStats).toHaveBeenCalledWith(expected);
  });

  it("should display comparison values", async () => {
    onTimeService.fetchOnTimeStats.and.returnValue(
      of({
        early: 35,
        late: 5,
        onTime: 60,
        completed: 100,
        scheduled: 100,
        incomplete: "0",
        averageDelay: 0,
        noData: 0,
      }),
    );
    spectator.click(byText("Compare"));
    spectator.detectChanges();

    await expect(component.tableData.onTime.comparisonValue).toEqual(0.6);
    await expect(component.tableData.early.comparisonValue).toEqual(0.35);
    await expect(component.tableData.late.comparisonValue).toEqual(0.05);
    expect(spectator.query(byText("60%"))).toBeVisible();
    expect(spectator.query(byText("35%"))).toBeVisible();
    expect(spectator.query(byText("5%"))).toBeVisible();
  });

  it("should show error message on error", () => {
    onTimeService.fetchOnTimeStats.and.returnValue(throwError(() => "error"));
    spectator.click(byText("Compare"));
    spectator.detectChanges();

    expect(
      spectator.query(
        byText("There was an issue comparing data, please try again."),
      ),
    ).toBeVisible();
  });
});
