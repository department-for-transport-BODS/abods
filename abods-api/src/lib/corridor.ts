import {
  bods_user,
  corridor,
  corridor_stops,
  naptan_adminarea,
  naptan_locality,
  naptan_stoppoint_latlong,
  PrismaClient,
  Timetable,
} from "@prisma/client";
import { CorridorType, MatchType } from "../types/generated.js";
import { SessionUser } from "../types/extra.js";
import { TimetableType } from "../resolvers/corridorFunctions.js";

export enum CorridorJourneyStatsOption {
  day,
  hour,
  dayOfWeek,
  hourAsNumber,
}

export interface AdminArea {
  admin_area?: naptan_adminarea;
}

export interface NaptanLocality {
  locality?: naptan_locality & AdminArea;
}

export interface StopWithLocality {
  naptan_stop?: naptan_stoppoint_latlong & NaptanLocality;
}

export type CorridorStopsWithNaptanStops = corridor_stops & StopWithLocality;

export type CorridorResultsType = corridor & {
  bods_user?: bods_user;
  corridor_stops?: CorridorStopsWithNaptanStops[];
};

export interface CorridorJourneyServiceStatsType {
  totalJourneyTime: number;
  recordedTransits: number;
  scheduledTransits: number;
  operatorNoc: string | null;
  serviceCode: string | null;
  lineName: string | null;
}

export const returnCorridor = (corridor: CorridorResultsType): CorridorType => {
  return {
    id: corridor.corridor_id,
    name: corridor.corridor_name,
    stops:
      corridor.corridor_stops?.map((stop) => ({
        stopId: stop.stop_id.toString(),
        sourceId: stop.naptan_stop?.atco_code ?? "",
        stopLocality: {
          localityAreaId:
            stop.naptan_stop?.locality?.admin_area_id?.toString() ?? "",
          localityAreaName: stop.naptan_stop?.locality?.admin_area?.name ?? "",
          localityId: stop.naptan_stop?.locality_id.toString() ?? "",
          localityName: stop.naptan_stop?.locality?.name ?? "",
        },
        stopLocation: {
          latitude: Number(stop.naptan_stop?.latitude),
          longitude: Number(stop.naptan_stop?.longitude),
        },
        stopName: stop.naptan_stop?.common_name ?? "",
      })) ?? [],
  };
};

export const returnCorridorType = (
  results: CorridorResultsType[],
): CorridorType[] => {
  return results.map((corridor) => returnCorridor(corridor));
};

export const getCorridorList = (db: PrismaClient, sessionUser: SessionUser) => {
  return db.corridor.findMany({
    where: {
      organisation_id: { in: sessionUser.orgIds },
    },
    include: {
      corridor_stops: true,
      bods_user: true,
    },
  });
};

export const getCorridor = (
  corridorId: number,
  db: PrismaClient,
  sessionUser: SessionUser,
) => {
  return db.corridor.findUnique({
    where: {
      corridor_id: corridorId,
      organisation_id: { in: sessionUser.orgIds },
    },
    include: {
      bods_user: true,
      corridor_stops: {
        include: {
          naptan_stop: {
            include: {
              locality: {
                include: {
                  admin_area: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const deleteCorridorDb = (corridorId: number, db: PrismaClient) => {
  return db.corridor.delete({
    where: {
      corridor_id: corridorId,
    },
  });
};

export const deleteCorridorStops = (corridorId: number, db: PrismaClient) => {
  return db.corridor_stops.deleteMany({
    where: {
      corridor_id: corridorId,
    },
  });
};

export const updateCorridorDb = (
  corridorId: number,
  corridorName: string,
  db: PrismaClient,
) => {
  return db.corridor.update({
    where: {
      corridor_id: corridorId,
    },
    data: {
      corridor_name: corridorName,
    },
  });
};

export const isCorridorMappedToUserOrg = async (
  corridorId: number,
  user: SessionUser,
  db: PrismaClient,
): Promise<boolean> => {
  const result = await db.corridor.findFirst({
    where: {
      corridor_id: corridorId,
      organisation_id: { in: user.orgIds },
    },
  });

  return !!result;
};

export const distinctRoutes = (db: PrismaClient, stopsPattern: string) => {
  return db.distinct_routes.findMany({
    where: {
      route: {
        contains: stopsPattern,
      },
    },
  });
};

export const getOrgAdminAreas = async (db: PrismaClient, user: SessionUser) => {
  const orgOperators = await db.bods_organisationoperator.findMany({
    where: {
      organisation_id: { in: user.orgIds },
    },
    select: {
      operatorref: true,
    },
  });
  return db.noc_adminarea.findMany({
    where: {
      national_operator_code: {
        in: orgOperators.map((op) => op.operatorref),
      },
    },
    select: {
      adminarea_id: true,
    },
  });
};

export const getJourneyDeparture = (
  journey: TimetableType,
  matchType: MatchType,
) => {
  return (
    journey.actual_departure_time ??
    (matchType === MatchType.Estimated
      ? journey.timestamp_after_estimate
      : null)
  );
};
