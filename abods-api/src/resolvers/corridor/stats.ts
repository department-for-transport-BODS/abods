import dayjs from "dayjs";
import { listServiceLinks } from "../../lib/common.js";
import {
  getStopDepartureTime,
  CorridorTransitStatsOption,
  CorridorTransitServiceStatsType,
} from "../../lib/corridor.js";
import { standardFormat, toUkTime } from "../../lib/dayjs.js";
import { getPercentile } from "../../lib/utils.js";
import {
  CorridorStatsTypeResolvers,
  CorridorSummaryStatsType,
  CorridorTransitTimeStatsType,
  CorridorStatsTimeOfDayType,
  CorridorStatsDayOfWeekType,
  CorridorGranularity,
  MatchType,
  CorridorStatsPerServiceType,
  CorridorStatsHistogramType,
  ServiceLinkType,
  Resolvers,
} from "../../types/generated.js";

import { StatsCache, TimetableType } from "../../types/extra.js";
import { executeQuery } from "../../lib/dbKysely.js";

export const getSummaryStats: CorridorStatsTypeResolvers["summaryStats"] = (
  parent,
): CorridorSummaryStatsType => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const scheduledTransits = data.corridorTransits.length;
  let totalTransits = 0;
  let totalTransitTime = 0;
  const services = new Set();
  data.corridorTransits.map((transit) => {
    const firstDeparture = getStopDepartureTime(
      transit[0],
      data.inputs.matchType,
    );

    const lastDeparture = getStopDepartureTime(
      transit[transit.length - 1],
      data.inputs.matchType,
    );

    if (firstDeparture && lastDeparture) {
      totalTransits += 1;
      totalTransitTime +=
        (lastDeparture.getTime() - firstDeparture.getTime()) / 1000; //In seconds
    }

    const serviceCode = `${transit[0].operator_noc}${transit[0].service_code}${transit[0].line_name}`;
    if (!services.has(serviceCode)) {
      services.add(serviceCode);
    }
  });

  const averageTransitTime =
    totalTransits > 0 ? Math.ceil(totalTransitTime / totalTransits) : 0;
  return {
    scheduledTransits,
    totalTransits,
    averageTransitTime: averageTransitTime,
    numberOfServices: services.size,
  };
};

export const getTransitTimeOfDayStats: CorridorStatsTypeResolvers["transitTimeTimeOfDayStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getTransitStats(
      data.corridorTransits,
      CorridorTransitStatsOption.hourAsNumber,
      data.inputs.matchType,
    );
  };

export const getTransitDayOfWeekStats: CorridorStatsTypeResolvers["transitTimeDayOfWeekStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getTransitStats(
      data.corridorTransits,
      CorridorTransitStatsOption.dayOfWeek,
      data.inputs.matchType,
    );
  };

export const getTransitTimeStats: CorridorStatsTypeResolvers["transitTimeStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return data.inputs?.granularity === CorridorGranularity.Day
      ? getTransitStats(
          data.corridorTransits,
          CorridorTransitStatsOption.day,
          data.inputs.matchType,
        )
      : getTransitStats(
          data.corridorTransits,
          CorridorTransitStatsOption.hour,
          data.inputs.matchType,
        );
  };

const getTransitStats = (
  corridorTransits: TimetableType[][],
  inputType: CorridorTransitStatsOption,
  matchType: MatchType,
) => {
  const transitStats = new Map<string, number[]>();
  corridorTransits.map((transit) => {
    const firstDeparture = transit[0];

    const firstStopDeparture = getStopDepartureTime(transit[0], matchType);
    const lastDeparture = getStopDepartureTime(
      transit[transit.length - 1],
      matchType,
    );

    if (firstStopDeparture && lastDeparture) {
      let dateKey = "";
      switch (inputType) {
        case CorridorTransitStatsOption.day:
          dateKey = standardFormat(toUkTime(firstDeparture.date_of_journey));
          break;

        case CorridorTransitStatsOption.dayOfWeek:
          dateKey = dayjs(firstDeparture.date_of_journey).day().toString();
          break;

        case CorridorTransitStatsOption.hour:
          dateKey = standardFormat(
            toUkTime(firstDeparture.expected_departure_time).startOf("hour"),
          );
          break;

        case CorridorTransitStatsOption.hourAsNumber:
          dateKey = toUkTime(firstDeparture.expected_departure_time)
            .hour()
            .toString();
          break;

        default:
          throw new Error("Invalid transit indicator type provided");
      }

      const transitTime = transitStats.get(dateKey) || [];
      transitTime.push(
        (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000,
      );
      transitStats.set(dateKey, transitTime);
    }
  });

  const stats: (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] = [];
  transitStats.forEach((transitTimes: number[], key: string) => {
    transitTimes.sort((a, b) => a - b);

    stats.push({
      ts: key,
      hour: Number(key),
      dow: Number(key),
      avgTransitTime: Math.ceil(
        transitTimes.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        ) / transitTimes.length,
      ),
      minTransitTime: transitTimes[0],
      maxTransitTime: transitTimes[transitTimes.length - 1],
      percentile25: getPercentile(25, transitTimes),
      percentile75: getPercentile(75, transitTimes),
    });
  });

  return stats;
};

export const getTransitStatsPerService: CorridorStatsTypeResolvers["transitTimePerServiceStats"] =
  async (parent, _, context): Promise<CorridorStatsPerServiceType[]> => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const transitStats = new Map<string, CorridorTransitServiceStatsType>();
    const stats: CorridorStatsPerServiceType[] = [];
    data.corridorTransits.map((transit) => {
      const firstDeparture = transit[0];

      const firstStopDeparture = getStopDepartureTime(
        transit[0],
        data.inputs.matchType,
      );
      const lastDeparture = getStopDepartureTime(
        transit[transit.length - 1],
        data.inputs.matchType,
      );
      // noc_line_and_servicecode
      const service = `${firstDeparture.operator_noc}-${firstDeparture.line_name}-${firstDeparture.service_code}`;
      const transitTime = transitStats.get(service) || {
        totalTransitTime: 0,
        recordedTransits: 0,
        scheduledTransits: 0,
        lineName: firstDeparture.line_name,
        operatorNoc: firstDeparture.operator_noc,
        serviceCode: firstDeparture.service_code,
      };
      transitTime.scheduledTransits += 1;
      if (firstStopDeparture && lastDeparture) {
        transitTime.totalTransitTime +=
          (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000;
        transitTime.recordedTransits += 1;
      }
      transitStats.set(service, transitTime);
    });

    if (transitStats.size > 0) {
      const services = await context.db.service_details.findMany({
        where: {
          noc_and_line_and_servicecode: {
            in: [...transitStats.keys()],
          },
        },
        include: {
          operator: true,
        },
      });

      transitStats.forEach((transits, key) => {
        const serviceDetails = services.find(
          (service) => service.noc_and_line_and_servicecode === key,
        );
        stats.push({
          lineName: serviceDetails?.line_name ?? "",
          operatorName: serviceDetails?.operator?.name ?? "NA",
          noc: serviceDetails?.operator_noc,
          servicePatternName: serviceDetails?.service_name ?? "",
          recordedTransits: transits.recordedTransits,
          totalTransitTime: transits.totalTransitTime,
          scheduledTransits: transits.scheduledTransits,
        });
      });
    }

    return stats;
  };

export const getTransitStatsHistogram: CorridorStatsTypeResolvers["transitTimeHistogram"] =
  (parent): CorridorStatsHistogramType[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const transitStats = new Map<string, number>();

    data.corridorTransits.map((transit) => {
      const firstStopDeparture = getStopDepartureTime(
        transit[0],
        data.inputs.matchType,
      );
      const lastDeparture = getStopDepartureTime(
        transit[transit.length - 1],
        data.inputs.matchType,
      );
      if (firstStopDeparture && lastDeparture) {
        const totalTransitTime = Math.floor(
          (lastDeparture.getTime() - firstStopDeparture.getTime()) /
            (1000 * 60),
        );

        transitStats.set(
          totalTransitTime.toString(),
          (transitStats.get(totalTransitTime.toString()) || 0) + 1,
        );
      }
    });

    return [
      {
        ts: null,
        hist: Array.from(transitStats, ([key, value]) => ({
          bin: Number(key),
          freq: value,
        })),
      },
    ];
  };

export const getServiceLinks: CorridorStatsTypeResolvers["serviceLinks"] =
  async (parent, _, context): Promise<ServiceLinkType[]> => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;

    const query = context.kysely
      .selectFrom("corridor_stops")
      .innerJoin(
        "naptan_stoppoint_latlong",
        "corridor_stops.stop_id",
        "naptan_stoppoint_latlong.id",
      )
      .where("corridor_stops.corridor_id", "=", Number(data.inputs.corridorId))
      .select([
        "corridor_stops.corridor_index",
        "naptan_stoppoint_latlong.atco_code",
        "naptan_stoppoint_latlong.latitude",
        "naptan_stoppoint_latlong.longitude",
      ]);

    const results = await executeQuery(query).then((result) =>
      result.map((x) => ({
        corridorIndex: x.corridor_index,
        stopId: x.atco_code ?? "",
        lat: x.latitude ?? 0,
        lon: x.longitude ?? 0,
      })),
    );

    results.sort((a, b) => a.corridorIndex - b.corridorIndex);

    return listServiceLinks(results, context.kysely);
  };

const corridorStats: Resolvers = {
  CorridorStatsType: {
    summaryStats: getSummaryStats,
    transitTimeStats: getTransitTimeStats,
    transitTimeTimeOfDayStats: getTransitTimeOfDayStats,
    transitTimeDayOfWeekStats: getTransitDayOfWeekStats,
    transitTimeHistogram: getTransitStatsHistogram,
    transitTimePerServiceStats: getTransitStatsPerService,
    serviceLinks: getServiceLinks,
  },
};

export default corridorStats;
