import { Context } from "../../context";
import {
  getDate,
  getDateLocale,
  getUTCDate,
  parseTimetz,
} from "../../lib/dayjs.js";
import logger from "../../logger.js";
import {
  UniqueJourneyType,
  VehicleReplayInputType,
  Maybe,
  GpsFeedType,
  ServicePatternType,
  StopType,
  VehicleJourneyType,
  TimingPatternDetailType,
  GpsFeedJourneyStatus,
} from "../../types.js";

export const findJourneys = async (
  inputs: VehicleReplayInputType,
  sessionUser: any,
  db: Context
): Promise<UniqueJourneyType[]> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }
  const lineIds = inputs.filters?.lineIds;

  let journeysData: UniqueJourneyType[] = [];
  if (lineIds && lineIds.length > 0 && lineIds[0]) {
    const currentTime = getDate();
    const toTimestamp = getDate(inputs.toTimestamp).subtract(4, "hour");
    let journeys = await db.prisma.expected_journeys.findMany({
      where: {
        noc_and_line: lineIds[0],
        date_of_journey: toTimestamp.toDate(),
      },
      include: {
        expected_service: {
          select: {
            line_name: true,
          },
        },
      },
    });

    logger.info(`currentTime------${currentTime}`)
    logger.info(`toTimestamp------${toTimestamp}`)
    if (toTimestamp.isSame(currentTime, "day")) {
      logger.info('same day------')
      journeys = journeys.filter((journey) => {
        const parsedTime = parseTimetz(
          journey.expected_journey_start?.toTimeString() ?? ""
        );
        logger.info(`expected_journey_start------${journey.expected_journey_start?.toTimeString()}`)
        logger.info(`expected_journey_start local------${journey.expected_journey_start?.toLocaleTimeString()}`)
        logger.info(`parsedTime------${parsedTime}`)
        logger.info(`condition------${parsedTime.isBefore(currentTime, "second")}`)
        return parsedTime.isBefore(currentTime, "second");
      });
    }

    logger.info(`journeys------${JSON.stringify(journeys)}`)

    journeysData = journeys.map((journey) => {
      const departureTime = getUTCDate(journey.expected_journey_start);
      const journeyDate = getDate(journey.date_of_journey);

      const startTime = getDateLocale(
        `${journeyDate.format("YYYY-MM-DD")}T${departureTime.format(
          "HH:mm:ss"
        )}`
      );

      const journeyDescription: string = journey.journey_pattern_description;
      return {
        vehicleJourneyId: journey.group_id,
        startTime: startTime.toISOString(),
        serviceInfo: {
          serviceName: journeyDescription,
          serviceNumber: journey.expected_service.line_name,
          serviceId: journey.group_id,
        },
      };
    });
  }

  return journeysData;
};

export const getJourney = async (
  journeyId: string,
  startTime: Date,
  sessionUser: any,
  db: Context
): Promise<Array<Maybe<GpsFeedType>>> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }
  let journeyData: Array<Maybe<GpsFeedType>> = [];

  const journeyDate = new Date(startTime.toISOString().substring(0, 10));

  const journeys = await db.prisma.timetable.findMany({
    where: {
      group_id: journeyId,
      date_of_journey: journeyDate,
    },
    include: {
      expected_journeys: {
        select: {
          expected_journey_start: true,
          expected_service: {
            select: {
              noc_and_line: true,
              service_name: true,
              line_name: true,
              expected_operator: {
                select: {
                  operator_noc: true,
                  operator_name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const journeyCount = journeys.length;
  journeyData = journeys
    .map((journey, index) => {
      const journeyDepartureTime = getDate(
        journey.expected_journeys.expected_journey_start
      );
      const stopDepartureTime = getDate(journey.expected_departure_time);
      const journeyDate = getDate(journey.date_of_journey);
      const actualDepartureTime = getDate(journey.actual_departure_time);
      const startTime = getDateLocale(
        `${journeyDate.format("YYYY-MM-DD")}T${journeyDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const timestamp = getDateLocale(
        `${journeyDate.format("YYYY-MM-DD")}T${actualDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const stopScheduledTime = getDateLocale(
        `${journeyDate.format("YYYY-MM-DD")}T${stopDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const previousIndex = index === 0 ? 0 : index - 1;
      return {
        ts: timestamp.toISOString(),
        vehicleId: journey.group_id,
        vehicleJourneyId: journey.group_id,
        servicePatternId: journey.vehiclejourney_id.toString(),
        isTimingPoint: journey.is_timing_point,
        delay: journey.time_difference
          ? Math.floor(journey.time_difference / 60)
          : 0,
        startTime: startTime.toISOString(),
        scheduledDeparture: stopScheduledTime.toISOString(),
        lat: Number(journey.stop_latitude),
        lon: Number(journey.stop_longitude),
        journeyStatus: journey.actual_departure_time
          ? index + 1 === journeyCount
            ? GpsFeedJourneyStatus.Completed
            : GpsFeedJourneyStatus.Started
          : GpsFeedJourneyStatus.Unknown,
        operatorInfo: {
          operatorId:
            journey.expected_journeys.expected_service.expected_operator
              .operator_noc,
          operatorName:
            journey.expected_journeys.expected_service.expected_operator
              .operator_name,
          nocCode:
            journey.expected_journeys.expected_service.expected_operator
              .operator_noc,
        },
        serviceInfo: {
          serviceId: journey.expected_journeys.expected_service.noc_and_line,
          serviceNumber: journey.expected_journeys.expected_service.line_name,
          serviceName: journey.expected_journeys.expected_service.service_name,
        },
        previousStopInfo: {
          stopId: journeys[previousIndex].atco_code?.toString() ?? "",
          stopName: journeys[previousIndex].common_name ?? "",
          sourceId: "test",
          stopLocality: {
            localityAreaId: "",
            localityAreaName: "",
            localityId: "",
            localityName: "",
          },
          stopLocation: {
            latitude: Number(journey.stop_latitude),
            longitude: Number(journey.stop_longitude),
          },
        },
      };
    });

  return journeyData;
};

export const servicePatternsInfo = async (
  vehicleJourneyId: string[],
  sessionUser: any,
  db: Context
): Promise<Array<Maybe<ServicePatternType>>> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }
  let servicePatterns: Array<Maybe<ServicePatternType>> = [];
  if (vehicleJourneyId && vehicleJourneyId.length > 0) {
    const vehicleJourney = await db.prisma.transmodel_vehiclejourney.findUnique(
      {
        where: {
          id: Number(vehicleJourneyId[0]),
        },
        include: {
          stops: {
            select: {
              naptan_stop: {
                select: {
                  common_name: true,
                  latitude: true,
                  longitude: true,
                },
              },
              atco_code: true,
              txc_common_name: true
            },
          },
        },
      }
    );

    const stops: Array<Maybe<StopType>> | undefined = vehicleJourney?.stops.map(
      (stop) => {
        return {
          stopId: stop.atco_code,
          stopName: stop.naptan_stop.common_name ?? stop.txc_common_name,
          lon: Number(stop.naptan_stop.longitude),
          lat: Number(stop.naptan_stop.latitude),
        };
      }
    );

    servicePatterns = [
      {
        stops: stops ?? [],
        servicePatternId: vehicleJourneyId[0],
        serviceLinks: [],
        name: "",
      },
    ];
  }

  return servicePatterns;
};

export const vehicleJourney = async (
  vehicleJourneyId: string,
  sessionUser: any,
  db: Context
): Promise<Maybe<VehicleJourneyType>[]> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }

  const journey = await db.prisma.expected_journeys.findUnique({
    where: {
      group_id: vehicleJourneyId,
    },
    include: {
      expected_service: {
        select: {
          expected_operator: true,
          operator_noc: true,
        },
      },
    },
  });

  return [
    {
      mode: "",
      operatorId:
        journey?.expected_service.expected_operator.operator_noc ?? "",
      servicePatternId: journey?.vehicle_journey_id.toString() ?? "",
      timingPatternId: journey?.vehicle_journey_id.toString() ?? "",
      vehicleJourneyId: vehicleJourneyId,
    },
  ];
};

export const timingPatternDetail = async (
  timingPatternId: string,
  sessionUser: any,
  db: Context
): Promise<Maybe<TimingPatternDetailType>[]> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }

  const journey = await db.prisma.transmodel_vehiclejourney.findUnique({
    where: {
      id: Number(timingPatternId),
    },
    include: {
      stops: true,
    },
  });

  const journeyDepartureTime = getDate(journey?.start_time);

  return (
    journey?.stops.map((stop, index) => ({
      stopIndex: index,
      arrivalTimeOffset: 0,
      departureTimeOffset: journey?.start_time
        ? getDate(stop.departure_time).diff(journeyDepartureTime, "minute")
        : 0,
      createdAt: getDate(),
      noPickup: false,
      noSetdown: false,
      requestStop: false,
      timingPatternId: timingPatternId,
      timingPoint: stop.is_timing_point,
      updatedAt: getDate(),
      version: "1",
    })) ?? []
  );
};
