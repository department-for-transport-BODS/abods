import { Component, Input } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { OtpThresholdModalData, OTP_THRESHOLD_MODAL_ID } from '../otp-threshold-modal/otp-threshold-modal.component';

@Component({
  selector: 'app-otp-threshold-modal-link',
  templateUrl: './otp-threshold-modal-link.component.html',
  styleUrls: ['./otp-threshold-modal-link.component.scss'],
})
export class OtpThresholdModalLinkComponent {
  @Input() modalData!: OtpThresholdModalData;
  constructor(private modalService: NgxSmartModalService) {}

  openModal() {
    this.modalService.setModalData(this.modalData, OTP_THRESHOLD_MODAL_ID, true);
    this.modalService.open(OTP_THRESHOLD_MODAL_ID);
  }
}
