import { provideHttpClient } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import {
  byText,
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime, Settings } from "luxon";
import { MockComponents } from "ng-mocks";
import { NgxSmartModalModule, NgxSmartModalService } from "ngx-smart-modal";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { SharedModule } from "../../shared/shared.module";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import {
  OTP_THRESHOLD_MODAL_ID,
  OtpThresholdModalComponent,
  OtpThresholdModalData,
} from "../otp-threshold-modal/otp-threshold-modal.component";
import { OtpThresholdModalLinkComponent } from "./otp-threshold-modal-link.component";

fdescribe("OtpThresholdModalLinkComponent", () => {
  let spectator: Spectator<OtpThresholdModalLinkComponent>;
  let component: OtpThresholdModalLinkComponent;
  let modalService: SpyObject<NgxSmartModalService>;

  const modalData: OtpThresholdModalData = {
    params: {
      fromTimestamp: DateTime.now().toISO(),
      toTimestamp: DateTime.now().plus({ days: 1 }).toISO(),
    },
    defaultValues: {
      early: 10,
      late: 20,
      onTime: 70,
    },
  } as OtpThresholdModalData;

  const createComponent = createComponentFactory({
    component: OtpThresholdModalLinkComponent,
    declarations: [
      MockComponents(OtpThresholdModalComponent, OtpThresholdFormComponent),
    ],
    imports: [
      ApolloTestingModule,
      SharedModule,
      ReactiveFormsModule,
      NgxSmartModalModule,
      NgxTippyModule,
    ],
    providers: [provideHttpClient()],
    mocks: [NgxSmartModalService],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    modalService = spectator.inject(NgxSmartModalService);
    Settings.now = () => 1630494000000; // 2021-09-01T12:00:00
  });

  it("should create the component", async () => {
    await expect(component).toBeTruthy();
  });

  it("should set modal data on open", () => {
    component.modalData = modalData;

    spectator.click(byText("Compare thresholds"));

    expect(modalService.setModalData).toHaveBeenCalledWith(
      modalData,
      OTP_THRESHOLD_MODAL_ID,
      true,
    );
  });

  it("should open modal", () => {
    component.modalData = modalData;

    spectator.click(byText("Compare thresholds"));

    expect(modalService.open).toHaveBeenCalledWith(OTP_THRESHOLD_MODAL_ID);
  });
});
