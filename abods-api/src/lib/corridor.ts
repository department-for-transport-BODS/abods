import { bods_user, corridor, corridor_stops, naptan_adminarea, naptan_locality, naptan_stoppoint_latlong, Timetable } from "@prisma/client";
import { CorridorType, SessionUser, StopInfoType } from "../types";
import { Context } from "../context";

export enum CorridorJourneyStatsOption {
  day,
  hour,
  dayOfWeek,
  hourAsNumber,
}

export type AdminArea = {
  admin_area?: naptan_adminarea
}

export type NaptanLocality = {
  locality?: naptan_locality & AdminArea
}

export type StopWithLocality = {
  naptan_stop?: naptan_stoppoint_latlong & NaptanLocality
}

export type CorridorStopsWithNaptanStops = corridor_stops & StopWithLocality

export type CorridorResultsType = corridor & {
  bods_user?: bods_user;
  corridor_stops?: CorridorStopsWithNaptanStops[];
};

export type CorridorJourneyServiceStatsType = {
  totalJourneyTime: number
  recordedTransits: number
  scheduledTransits: number
  operatorNoc: string | null,
  serviceCode: string | null,
  lineName: string | null
}

export const returnCorridor = (corridor: CorridorResultsType): CorridorType => {
  return {
    id: corridor.corridor_id,
    name: corridor.corridor_name,
    createdBy: {
      email: corridor.bods_user?.email ?? "",
      id: corridor.bods_user?.id.toString() ?? "",
      roles: [],
      username: corridor.bods_user?.username ?? "",
    },
    stops: corridor.corridor_stops?.map((stop) => ({
      stopId: stop.stop_id.toString(),
      sourceId: stop.naptan_stop?.atco_code ?? '',
      stopLocality: {
        localityAreaId:
          stop.naptan_stop?.locality?.admin_area_id.toString() ?? '',
        localityAreaName: stop.naptan_stop?.locality?.admin_area?.name ?? '',
        localityId: stop.naptan_stop?.locality_id.toString() ?? '',
        localityName: stop.naptan_stop?.locality?.name ?? '',
      },
      stopLocation: {
        latitude: Number(stop.naptan_stop?.latitude),
        longitude: Number(stop.naptan_stop?.longitude),
      },
      stopName: stop.naptan_stop?.common_name ?? '',
    })) ?? [],
  };
};

export const returnCorridorType = (results: CorridorResultsType[]): CorridorType[] => {
    return results.map((corridor) => returnCorridor(corridor));
} 

export const getCorridorList = (db: Context, sessionUser: SessionUser) => {
    return db.prisma.corridor.findMany({
        where: {
          organisation_id: {
            in: sessionUser.userOrganisationIDs?.filter((o) => o),
          },
        },
        include: {
          corridor_stops: true,
          bods_user: true,
        },
      });
}

export const getCorridor = (
  corridorId: Number,
  db: Context,
  sessionUser: SessionUser
) => {
  return db.prisma.corridor.findUnique({
    where: {
      corridor_id: Number(corridorId),
      organisation_id: {
        in: sessionUser.userOrganisationIDs?.filter((o) => o),
      },
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

export const deleteCorridorDb = (corridorId: Number, db: Context) => {
  return db.prisma.corridor.delete({
    where: {
      corridor_id: Number(corridorId)
    }
  })
}

export const deleteCorridorStops = (corridorId: Number, db: Context) => {
  return db.prisma.corridor_stops.deleteMany({
    where: {
      corridor_id: Number(corridorId)
    }
  })
}

export const updateCorridorDb = (
  corridorId: Number,
  corridorName: string,
  db: Context,
) => {

  return db.prisma.corridor.update({
    where: {
      corridor_id: Number(corridorId)
    },
    data: {
      corridor_name: corridorName
    }
  })
};

export const filteredJourneys = (
  stopCount: number,
  journeyMap: Map<string, Timetable[]>,
): Map<string, Timetable[]> => {
  const filteredJourneyMap: Map<string, Timetable[]> = new Map(
    [...journeyMap.entries()].filter(([key, arr]) => arr.length === stopCount),
  );

  return filteredJourneyMap;
};

export const isCorridorMappedToUserOrg = async (
  corridorId: number,
  sessionUser: SessionUser,
  db: Context,
): Promise<boolean> => {
  const result = await db.prisma.corridor.findFirst({
    where: {
      corridor_id: corridorId,
      organisation_id: sessionUser.userOrganisationIDs?.[0],
    },
  });

  return !!result;
};