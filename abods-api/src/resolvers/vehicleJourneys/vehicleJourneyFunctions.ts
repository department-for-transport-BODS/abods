import { Context } from "../../context";
import { getDate, getUTCDate, parseTimetz } from "../../lib/dayjs.js";
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
import logger from '../../logger.js'
import dayjs from "dayjs";

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
    const journeys = await db.prisma.expected_journeys.findMany({
      where: {
        noc_and_line: lineIds[0],
        date_of_journey: getDate(inputs.toTimestamp)
          .subtract(4, "hour")
          .toDate(),
      },
      include: {
        expected_service: {
          select: {
            line_name: true,
          },
        },
      },
    });

    journeysData = journeys
      .filter((journey) => {
        const parsedTime = parseTimetz(
          journey.expected_journey_start?.toLocaleTimeString() ?? ""
        );
        return parsedTime.isBefore(currentTime, "second");
      })
      .map((journey) => {
        const departureTime = getUTCDate(journey.expected_journey_start);
        const journeyDate = getDate(journey.date_of_journey);
        
        const startTime = dayjs.tz(`${journeyDate.format("YYYY-MM-DD")}T${departureTime.format(
            "HH:mm:ss"
          )}`, 'Europe/London');
        

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

  journeyData = journeys
    .sort((a, b) => (a.stop_index > b.stop_index ? 1 : -1))
    .map((journey, index) => {
      const journeyDepartureTime = getDate(
        journey.expected_journeys.expected_journey_start
      );
      const stopDepartureTime = getDate(journey.expected_departure_time);
      const journeyDate = getDate(journey.date_of_journey);
      const scheduledDepartureTime = getDate(journey.actual_departure_time);
      const startTime = getDate(
        `${journeyDate.format("YYYY-MM-DD")}T${journeyDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const stopTime = getDate(
        `${journeyDate.format("YYYY-MM-DD")}T${stopDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const stopScheduledTime = getDate(
        `${journeyDate.format("YYYY-MM-DD")}T${scheduledDepartureTime.format(
          "HH:mm:ss"
        )}`
      );
      const previousIndex = index == 0 ? 0 : index - 1;
      return {
        ts: stopTime.toISOString(),
        vehicleId: journey.group_id,
        vehicleJourneyId: journey.group_id,
        servicePatternId: journey.vehiclejourney_id.toString(),
        isTimingPoint: journey.is_timing_point,
        delay: journey.time_difference ?? 0,
        startTime: startTime.toISOString(),
        scheduledDeparture: stopScheduledTime.toISOString(),
        lat: Number(journey.stop_latitude),
        lon: Number(journey.stop_longitude),
        journeyStatus: GpsFeedJourneyStatus.Completed,
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
  console.log("before------")
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
              naptan_stop: true,
              atco_code: true,
              txc_common_name: true,
            },
          },
        },
      }
    );

    console.log("vehicleJourney------",vehicleJourney)
    const stops: Array<Maybe<StopType>> | undefined = vehicleJourney?.stops.map(
      (stop) => {
        console.log("matches-----",stop.naptan_stop)
        // const matches = stop.naptan_stop.location.match(
        //   /POINT\(([^ ]+) ([^ ]+)\)/
        // );
        // console.log("matches-----",matches)
        // if (matches) {
        //   const longitude = parseFloat(matches[1]);
        //   const latitude = parseFloat(matches[2]);
          return {
            stopId: stop.atco_code,
            stopName: stop.txc_common_name ?? "",
            // lon: longitude,
            // lat: latitude,
            lon: 0,
            lat: 0,
          };
        // } else {
        //   throw new Error(
        //     `Invalid geometry format: ${stop.naptan_stop.location}`
        //   );
        // }
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
  
  const journey = await db.prisma.transmodel_vehiclejourney.findMany({
    where: {
      id: Number(timingPatternId),
    },
    include: {
      stops: true,
    },
  });

  return journey[0].stops.map((stop) => ({
    stopIndex: stop.sequence_number,
    arrivalTimeOffset: 0,
    departureTimeOffset: 0,
    createdAt: getDate(),
    noPickup: false,
    noSetdown: false,
    requestStop: false,
    timingPatternId: timingPatternId,
    timingPoint: stop.is_timing_point,
    updatedAt: getDate(),
    version: "1",
  }));
};
