import { TestBed } from '@angular/core/testing';
import {
  CorridorJourneyTimeStatsType,
  CorridorStatsDayOfWeekType,
  CorridorStatsTimeOfDayType,
  ServiceLinkType,
} from '../../generated/graphql';

import { CorridorsSpeedMetricService } from './corridors-speed-metric.service';
import { CorridorStats, CorridorStatsViewParams, Stop } from './corridors.service';
import { BoxPlotChartDataItem } from './view/box-plot-chart/box-plot-chart.component';

describe('CorridorsSpeedMetricService', () => {
  let service: CorridorsSpeedMetricService;
  const serviceLinks: ServiceLinkType[] = [
    {
      fromStop: 'ST0100BRP90312',
      toStop: 'ST0100BRA10796',
      distance: 100,
      routeValidity: '',
    },
    {
      fromStop: 'ST0100BRA10796',
      toStop: 'ST0100BRA10807',
      distance: 200,
      routeValidity: '',
    },
    {
      fromStop: 'ST0100BRA10807',
      toStop: 'ST0100BRP90340',
      distance: 300,
      routeValidity: '',
    },
    {
      fromStop: 'ST0100BRP90340',
      toStop: 'ST0100BRP90345',
      distance: 400,
      routeValidity: '',
    },
    {
      fromStop: 'ST0100BRP90345',
      toStop: 'ST0100BRP90003',
      distance: 500,
      routeValidity: '',
    },
  ];
  const totalDistance = 1500;
  const journeyTimeStats: (CorridorJourneyTimeStatsType & BoxPlotChartDataItem)[] = [
    {
      ts: '2022-04-26T00:00:00',
      minTransitTime: 10,
      maxTransitTime: 1000,
      avgTransitTime: 500,
      percentile25: 250,
      percentile75: 750,
    },
    {
      ts: '2022-04-27T00:00:00',
      minTransitTime: 20,
      maxTransitTime: 2000,
      avgTransitTime: 1000,
      percentile25: 500,
      percentile75: 1500,
    },
  ];
  const journeyTimeTimeOfDay: (CorridorStatsTimeOfDayType & BoxPlotChartDataItem)[] = [
    {
      minTransitTime: 10,
      maxTransitTime: 1000,
      avgTransitTime: 500,
      percentile25: 250,
      percentile75: 750,
      hour: 0,
      binLabel: '00:00 - 01:00',
      category: '00:00',
    },
    {
      minTransitTime: 20,
      maxTransitTime: 2000,
      avgTransitTime: 1000,
      percentile25: 500,
      percentile75: 1500,
      hour: 1,
      binLabel: '01:00 - 02:00',
      category: '01:00',
    },
  ];
  const journeyTimeDayOfWeek: (CorridorStatsDayOfWeekType & BoxPlotChartDataItem)[] = [
    {
      minTransitTime: 10,
      maxTransitTime: 1000,
      avgTransitTime: 500,
      percentile25: 250,
      percentile75: 750,
      binLabel: 'Monday',
      category: 'Mon',
      dow: 1,
      isoDayOfWeek: 1,
    },
    {
      minTransitTime: 20,
      maxTransitTime: 2000,
      avgTransitTime: 1000,
      percentile25: 500,
      percentile75: 1500,
      binLabel: 'Tuesday',
      category: 'Tue',
      dow: 2,
      isoDayOfWeek: 2,
    },
  ];
  const journeyTimeHist = [
    {
      bin: 0,
      freq: 1,
      xAxisCategory: '0:00',
      xAxisLabel: '0:00 - 0:59',
    },
    {
      bin: 1,
      freq: 1,
      xAxisCategory: '1:00',
      xAxisLabel: '1:00 - 1:59',
    },
    {
      bin: 2,
      freq: 2,
      xAxisCategory: '2:00',
      xAxisLabel: '2:00 - 2:59',
    },
    {
      bin: 3,
      xAxisCategory: '3:00',
      xAxisLabel: '3:00 - 3:59',
    },
    {
      bin: 4,
      freq: 3,
      xAxisCategory: '4:00',
      xAxisLabel: '4:00 - 4:59',
    },
  ];
  const stats = <CorridorStats>{
    journeyTimeTimeOfDayStats: journeyTimeTimeOfDay,
    journeyTimeDayOfWeekStats: journeyTimeDayOfWeek,
    journeyTimeHistogram: journeyTimeHist,
    journeyTimeStats: journeyTimeStats,
    serviceLinks: serviceLinks,
    summaryStats: {
      averageJourneyTime: 240,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorridorsSpeedMetricService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setTotalDistance', () => {
    it('should set totalDistance', () => {
      service.setTotalDistance(serviceLinks);

      expect(service.getTotalDistance()).toEqual(totalDistance);
    });
  });

  describe('generateSpeedStats', () => {
    it('should set the totalDistance', () => {
      service.generateSpeedStats(stats, undefined);

      expect(service.getTotalDistance()).toEqual(totalDistance);
    });

    it('should set averageSpeed', () => {
      const result = service.generateSpeedStats(stats, undefined);
      const expectedMph = 14;

      expect(result.averageSpeed).toEqual(expectedMph + 'mph');
    });

    it('should set transitSpeedStats', () => {
      const result = service.generateSpeedStats(stats, undefined);

      expect(result.transitSpeedStats.length).toEqual(2);
    });

    it('should set transitSpeedHistogram', () => {
      const result = service.generateSpeedStats(stats, undefined);

      expect(result.transitSpeedHistogram.length).toEqual(102);
    });

    it('should set transitSpeedTimeOfDay', () => {
      const result = service.generateSpeedStats(stats, undefined);

      expect(result.transitSpeedTimeOfDay.length).toEqual(2);
    });

    it('should set transitSpeedDayOfWeek', () => {
      const result = service.generateSpeedStats(stats, undefined);

      expect(result.transitSpeedDayOfWeek.length).toEqual(2);
    });

    it('should set empty arrays if CorridorStats undefined', () => {
      const result = service.generateSpeedStats(undefined, undefined);

      expect(result.averageSpeed).toEqual('0mph');
      expect(result.transitSpeedStats.length).toEqual(0);
      expect(result.transitSpeedHistogram.length).toEqual(0);
      expect(result.transitSpeedDayOfWeek.length).toEqual(0);
      expect(result.transitSpeedTimeOfDay.length).toEqual(0);
    });

    it('should set average speed for corridor section if params passed', () => {
      const params = <CorridorStatsViewParams>{
        stops: [
          <Stop>{
            stopId: 'ST0100BRP90312',
          },
          <Stop>{
            stopId: 'ST0100BRA10796',
          },
        ],
      };
      const expectedMph = 1;
      const result = service.generateSpeedStats(stats, params);

      expect(result.averageSpeed).toEqual(expectedMph + 'mph');
    });
  });

  describe('calculateTotalServiceLinkDistance', () => {
    it('should return total distance for all stops', () => {
      expect(service.calculateTotalServiceLinkDistance(serviceLinks)).toEqual(totalDistance);
    });

    it('should return 0 if no distances', () => {
      expect(service.calculateTotalServiceLinkDistance([])).toEqual(0);
    });
  });

  describe('calculateAverageCorridorSpeedMph', () => {
    beforeEach(() => {
      service.setTotalDistance(serviceLinks);
    });

    it('should return average corridor speed to nearest mph', () => {
      const seconds = 240;
      const expectedMph = 14;

      expect(service.calculateAverageCorridorSpeedMph(seconds)).toEqual(expectedMph + 'mph');
    });

    it('should return 0mph if seconds undefined', () => {
      expect(service.calculateAverageCorridorSpeedMph(undefined)).toEqual('0mph');
    });
  });

  describe('calculateTransitSpeedBoxPlotStats', () => {
    beforeEach(() => {
      service.setTotalDistance(serviceLinks);
    });

    [journeyTimeStats, journeyTimeTimeOfDay, journeyTimeDayOfWeek].forEach((stats) => {
      it('should return array of same length as journeyTimeStats array', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);

        expect(result.length).toEqual(stats.length);
      });

      it('should set yAxisMeanValue to average speed for each date', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);
        const expectedMph1 = 7;
        const expectedMph2 = 3;

        expect(result[0].yAxisMeanValue).toEqual(expectedMph1);
        expect(result[1].yAxisMeanValue).toEqual(expectedMph2);
      });

      it('should set yAxisMaxValue to max speed for each date', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);
        const expectedMph1 = 336;
        const expectedMph2 = 168;

        expect(result[0].yAxisMaxValue).toEqual(expectedMph1);
        expect(result[1].yAxisMaxValue).toEqual(expectedMph2);
      });

      it('should set yAxisMinValue to min speed for each date', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);
        const expectedMph1 = 3;
        const expectedMph2 = 2;

        expect(result[0].yAxisMinValue).toEqual(expectedMph1);
        expect(result[1].yAxisMinValue).toEqual(expectedMph2);
      });

      it('should set percentile25 to 25th percentile speed for each date', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);
        const expectedMph1 = 4;
        const expectedMph2 = 2;

        expect(result[0].percentile25).toEqual(expectedMph1);
        expect(result[1].percentile25).toEqual(expectedMph2);
      });

      it('should set percentile75 to 75th percentile speed for each date', () => {
        const result = service.calculateTransitSpeedBoxPlotStats(stats);
        const expectedMph1 = 13;
        const expectedMph2 = 7;

        expect(result[0].percentile75).toEqual(expectedMph1);
        expect(result[1].percentile75).toEqual(expectedMph2);
      });

      it('should not update values in journeyTimeStats', () => {
        service.calculateTransitSpeedBoxPlotStats(stats);

        expect(stats[0].minTransitTime).toEqual(10);
        expect(stats[0].maxTransitTime).toEqual(1000);
        expect(stats[0].avgTransitTime).toEqual(500);
        expect(stats[0].percentile25).toEqual(250);
        expect(stats[0].percentile75).toEqual(750);
      });
    });
  });

  describe('calculateTransitSpeedHistogram', () => {
    beforeEach(() => {
      service.setTotalDistance(serviceLinks);
    });

    it('should set frequency to average speed in mph', () => {
      const result = service.calculateTransitSpeedHistogram(journeyTimeHist);

      expect(result.find((bins) => bins.bin === 12)?.freq).toEqual(3);
      expect(result.find((bins) => bins.bin === 22)?.freq).toEqual(2);
      expect(result.find((bins) => bins.bin === 37)?.freq).toEqual(1);
      expect(result.find((bins) => bins.bin === 112)?.freq).toEqual(1);
    });

    it('should set xAxisCategory to average speed in mph', () => {
      const result = service.calculateTransitSpeedHistogram(journeyTimeHist);

      expect(result.find((bins) => bins.bin === 12)?.xAxisCategory).toEqual('12');
      expect(result.find((bins) => bins.bin === 22)?.xAxisCategory).toEqual('22');
      expect(result.find((bins) => bins.bin === 37)?.xAxisCategory).toEqual('37');
      expect(result.find((bins) => bins.bin === 112)?.xAxisCategory).toEqual('112');
    });

    it('should set xAxisLabel to average speed in mph', () => {
      const result = service.calculateTransitSpeedHistogram(journeyTimeHist);

      expect(result.find((bins) => bins.bin === 12)?.xAxisLabel).toEqual('12 mph');
      expect(result.find((bins) => bins.bin === 22)?.xAxisLabel).toEqual('22 mph');
      expect(result.find((bins) => bins.bin === 37)?.xAxisLabel).toEqual('37 mph');
      expect(result.find((bins) => bins.bin === 112)?.xAxisLabel).toEqual('112 mph');
    });

    it('should fill gaps starting from minimum speed bin', () => {
      const result = service.calculateTransitSpeedHistogram(journeyTimeHist);
      const minSpeedBin = 12;

      for (let i = 0; i < result.length; i++) {
        expect(result[i].bin).toEqual(i + minSpeedBin);
        expect(result[i].xAxisLabel).toEqual(`${i + minSpeedBin} mph`);
        expect(result[i].xAxisCategory).toEqual(`${i + minSpeedBin}`);
      }
    });

    it('should sum frequencies that fall into same speed bin', () => {
      const hist = [
        {
          bin: 9,
          freq: 1,
          xAxisCategory: '9:00',
          xAxisLabel: '9:00 - 9:59',
        },
        {
          bin: 10,
          freq: 1,
          xAxisCategory: '10:00',
          xAxisLabel: '10:00 - 10:59',
        },
        {
          bin: 11,
          freq: 1,
          xAxisCtegory: '11:00',
          xAxisLabel: '11:00 - 11:59',
        },
      ];
      const result = service.calculateTransitSpeedHistogram(hist);

      expect(result.find((bins) => bins.bin === 5)?.freq).toEqual(2);
      expect(result.find((bins) => bins.bin === 6)?.freq).toEqual(1);
      expect(result.find((bins) => bins.bin === 7)?.freq).toBeUndefined();
    });
  });
});
