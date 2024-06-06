import { AlertFragment, AlertTypeEnum } from 'src/generated/graphql';

export class AlertViewModel {
  private fragment: AlertFragment;

  constructor(alert: AlertFragment) {
    this.fragment = alert;
  }

  get sendToId() {
    return this.fragment.sendTo?.id;
  }

  get alertId() {
    return this.fragment.alertId;
  }

  get sendToName() {
    if (!this.fragment.sendTo?.firstName && !this.fragment.sendTo?.lastName) {
      return this.fragment.sendTo?.username;
    }
    return `${this.fragment.sendTo?.firstName} ${this.fragment.sendTo?.lastName}`;
  }

  get alertType() {
    if (this.fragment.alertType === AlertTypeEnum.FeedFailure) {
      return 'feed failure';
    } else if (this.fragment.alertType === AlertTypeEnum.VehicleCountDisparity) {
      return 'vehicle disparity';
    } else if (this.fragment.alertType === AlertTypeEnum.FeedComplianceFailure) {
      return 'feed compliance';
    }
  }

  get alertThreshold() {
    if (this.fragment.alertType == AlertTypeEnum.FeedFailure) {
      if (!this.fragment.eventHysterisis) {
        return 'Immediately';
      }
      return `${this.fragment.eventHysterisis} minute${this.fragment.eventHysterisis > 1 ? 's' : ''}`;
    } else if (this.fragment.alertType === AlertTypeEnum.VehicleCountDisparity) {
      let threshold = '';
      if (this.fragment.eventThreshold ?? 0 > 1) {
        threshold = `${this.fragment.eventThreshold} scheduled vehicles`;
      }
      return threshold;
    }
  }
}
