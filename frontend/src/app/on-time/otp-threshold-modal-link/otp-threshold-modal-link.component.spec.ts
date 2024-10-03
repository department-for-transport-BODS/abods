import { Spectator, createComponentFactory, byText } from '@ngneat/spectator';
import { DateTime, Settings } from 'luxon';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { OtpThresholdModalData, OTP_THRESHOLD_MODAL_ID } from '../otp-threshold-modal/otp-threshold-modal.component';
import { OtpThresholdModalLinkComponent } from './otp-threshold-modal-link.component';

describe('OtpThresholdModalLinkComponent', () => {
  let spectator: Spectator<OtpThresholdModalLinkComponent>;
  let component: OtpThresholdModalLinkComponent;
  let service: NgxSmartModalService;

  const modalData = <OtpThresholdModalData>{
    params: {
      fromTimestamp: DateTime.now().toISO(),
      toTimestamp: DateTime.now().plus({ days: 1 }).toISO(),
    },
    defaultValues: {
      early: 10,
      late: 20,
      onTime: 70,
    },
  };

  const createComponent = createComponentFactory({
    component: OtpThresholdModalLinkComponent,
    mocks: [NgxSmartModalService],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(NgxSmartModalService);
    Settings.now = () => 1630494000000; // 2021-09-01T12:00:00
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set modal data on open', () => {
    component.modalData = modalData;

    spectator.click(byText('Compare thresholds'));

    expect(service.setModalData).toHaveBeenCalledWith(modalData, OTP_THRESHOLD_MODAL_ID, true);
  });

  it('should open modal', () => {
    component.modalData = modalData;

    spectator.click(byText('Compare thresholds'));

    expect(service.open).toHaveBeenCalledWith(OTP_THRESHOLD_MODAL_ID);
  });
});
