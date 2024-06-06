import faker from 'faker';
import { DateTime, Interval } from 'luxon';
import {
  EventFragment,
  OperatorInfoType,
  OperatorLiveStatusFragment,
  ServiceInfoType,
  ServicePerformanceType,
  ServicePunctualityType,
} from 'src/generated/graphql';

export function fakeOperatorLiveStatus(feedStatus: boolean): OperatorLiveStatusFragment {
  const name = faker.company.companyName();
  return {
    name,
    nocCode: faker.random.alphaNumeric(5),
    operatorId: faker.random.alphaNumeric(4),
    feedMonitoring: {
      feedStatus,
      availability: faker.random.float({ min: 0.5, max: 1, precision: 0.00000001 }),
      lastOutage: feedStatus ? DateTime.local().minus({ minutes: faker.random.number({ min: 1, max: 10000 }) }) : null,
      unavailableSince: feedStatus
        ? null
        : DateTime.local().minus({ minutes: faker.random.number({ min: 1, max: 100 }) }),
      liveStats: {
        updateFrequency: faker.random.number({ min: 20, max: 60 }),
        currentVehicles: faker.random.number({ min: 0, max: 30 }),
        expectedVehicles: faker.random.number({ min: 0, max: 30 }),
        last24Hours: [...Array(24)].map((_, i) => {
          const actual = faker.random.number({ min: 0, max: 100 });
          const expected = faker.random.number({ min: actual, max: 100 });
          return {
            actual,
            expected,
            timestamp: DateTime.local().startOf('hour').minus({ hours: i }).toISO(),
          };
        }),
        last20Minutes: [...Array(20)].map((_, i) => {
          const actual = faker.random.number({ min: 0, max: 30 });
          const expected = faker.random.number({ min: actual, max: 30 });
          return {
            actual,
            expected,
            timestamp: DateTime.local().startOf('minute').minus({ minutes: i }).toISO(),
          };
        }),
      },
    },
  };
}

export function fakeEvent({
  message,
  type,
  start,
  end,
}: {
  message?: string;
  type?: string;
  start: DateTime;
  end?: DateTime;
}): EventFragment {
  const between = Interval.fromDateTimes(start, end ?? start);
  return {
    type: type ?? faker.random.arrayElement(['VehicleCountDisparityEvent', 'FeedUnavailableEvent']),
    timestamp: between.start.plus({ milliseconds: faker.random.number(between.toDuration().milliseconds) }),
    data: { message: message ?? faker.lorem.text(12) },
  };
}

export function fakeDashboardPunctualityStats() {
  return {
    onTime: faker.random.number(10000),
    early: faker.random.number(10000),
    late: faker.random.number(10000),
  };
}

export function fakeDashboardServiceRanking(overrides?: Partial<ServicePunctualityType>): ServicePunctualityType {
  const lineInfo: ServiceInfoType = overrides?.lineInfo ?? {
    serviceId: faker.random.number(100).toString(),
    serviceName: `${faker.address.city()} to ${faker.address.city()}`,
    serviceNumber: faker.random.number(100).toString(),
  };
  return {
    nocCode: overrides?.nocCode ?? faker.random.alphaNumeric(5),
    lineId: overrides?.lineId ?? faker.random.number(100).toString(),
    lineInfo: overrides?.lineInfo ?? lineInfo,
    onTime: overrides?.onTime ?? faker.random.number(1000),
    early: overrides?.early ?? faker.random.number(1000),
    late: overrides?.late ?? faker.random.number(1000),
    rank: overrides?.rank ?? faker.random.number({ min: 1, max: 5, precision: 0.01 }),
    trend:
      overrides?.trend ??
      ({
        onTime: faker.random.number(1000),
        early: faker.random.number(1000),
        late: faker.random.number(1000),
      } as ServicePunctualityType),
  };
}

export function fakeOnTimeServicePerformance(overrides?: Partial<ServicePerformanceType>): ServicePerformanceType {
  const lineInfo: ServiceInfoType = overrides?.lineInfo ?? {
    serviceId: faker.random.number(100).toString(),
    serviceName: `${faker.address.city()} to ${faker.address.city()}`,
    serviceNumber: faker.random.number(100).toString(),
  };
  const scheduledDepartures = overrides?.scheduledDepartures ?? faker.random.number(3000);
  const operatorInfo: OperatorInfoType = overrides?.operatorInfo ?? {
    nocCode: faker.random.alpha({ count: 4, upcase: true }),
    operatorId: `OP${faker.random.number(199).toString().padStart(3, '0')}`,
    operatorName: faker.company.companyName(),
  };
  return {
    onTime: overrides?.onTime ?? faker.random.number(1000),
    early: overrides?.early ?? faker.random.number(1000),
    late: overrides?.late ?? faker.random.number(1000),
    lineId: overrides?.lineId ?? faker.random.number(100).toString(),
    lineInfo,
    averageDelay: overrides?.averageDelay ?? faker.random.number({ min: -60, max: 600 }),
    scheduledDepartures,
    actualDepartures: overrides?.actualDepartures ?? faker.random.number(scheduledDepartures),
    operatorInfo,
  };
}
