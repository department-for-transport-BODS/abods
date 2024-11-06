import { DateTime, Duration } from 'luxon';
import { AlertTypeEnum, EventFragment } from 'src/generated/graphql';

export enum AlertMode {
  LiveStatus,
  FeedHistory,
}

export enum AlertLevel {
  Warning = 'warning',
  Error = 'error',
  Success = 'success',
}

export class AlertListViewModel {
  type: AlertTypeEnum;
  message: string;
  timestamp: DateTime;
  mode: AlertMode;

  constructor(event: EventFragment, mode: AlertMode) {
    this.type = event.type as AlertTypeEnum;
    this.message = event.data?.message;
    this.timestamp = DateTime.fromISO(event.timestamp, { zone: 'utc' }).toLocal();
    this.mode = mode;
  }

  get level(): AlertLevel {
    switch (this.type) {
      case AlertTypeEnum.VehicleCountDisparityEvent:
        return AlertLevel.Warning;
      case AlertTypeEnum.FeedUnavailableEvent:
        return AlertLevel.Error;
      case AlertTypeEnum.FeedAvailableEvent:
        return AlertLevel.Success;
      default:
        return AlertLevel.Success;
    }
  }

  get icon(): string {
    switch (this.type) {
      case AlertTypeEnum.VehicleCountDisparityEvent:
        return 'exclamation-in-circle';
      case AlertTypeEnum.FeedUnavailableEvent:
        return 'cross-in-circle-solid';
      case AlertTypeEnum.FeedAvailableEvent:
        return 'check-in-circle-solid';
      default:
        return 'check-in-circle-solid';
    }
  }

  get typeLabel() {
    switch (this.type) {
      case AlertTypeEnum.VehicleCountDisparityEvent:
        return 'Vehicle count disparity';
      case AlertTypeEnum.FeedUnavailableEvent:
        return 'Feed data unavailable';
      case AlertTypeEnum.FeedAvailableEvent:
        return 'Feed data available';
      default:
        return 'Feed data available';
    }
  }

  get displayMessage(): string {
    switch (this.type) {
      case AlertTypeEnum.VehicleCountDisparityEvent:
        return this.message;
      case AlertTypeEnum.FeedUnavailableEvent:
        return 'We are expecting to receive data but the feed is not active';
      case AlertTypeEnum.FeedAvailableEvent:
        return 'Vehicle data is now being received from an active feed';
      default:
        return 'Vehicle data is now being received from an active feed';
    }
  }

  get displayTime() {
    if (this.mode === AlertMode.LiveStatus) {
      if (DateTime.local().diff(this.timestamp, 'minutes') < Duration.fromObject({ minutes: 60 })) {
        return this.timestamp.toRelative();
      } else if (this.timestamp.hasSame(DateTime.local(), 'day')) {
        return `Today at ${this.timestamp.toFormat('HH:mm')}`;
      } else if (this.timestamp.hasSame(DateTime.local().minus({ days: 1 }), 'day')) {
        return `Yesterday at ${this.timestamp.toFormat('HH:mm')}`;
      } else {
        return this.timestamp.toFormat('HH:mm dd MMMM yyyy'); // shouldn't happen but does in simulation
      }
    } else {
      return this.timestamp.toFormat('HH:mm');
    }
  }

  get id() {
    return `alert-${this.type.toString().toLowerCase()}-${this.timestamp.toFormat('MMddHHmm')}`;
  }

  compare(other: AlertListViewModel) {
    // FeedHistory = ASC, LiveStatus = DESC
    const direction = this.mode === AlertMode.FeedHistory ? 1 : -1;
    if (this.timestamp < other.timestamp) {
      return -1 * direction;
    } else if (this.timestamp > other.timestamp) {
      return direction;
    } else {
      return 1;
    }
  }
}
