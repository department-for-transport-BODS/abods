import {
  ApiInfoType,
  ConfigData,
  Maybe,
  QueryResolvers,
  Resolvers,
  RoleType,
  ScopeEnum,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";
import logger from "../logger.js";

// Summary: fetch api info
export const getApiInfo: QueryResolvers["apiInfo"] = async (
  _,
  __,
  context,
): Promise<Maybe<ApiInfoType>> => {
  const apiInfo = await context.db.apiInfo.findFirst();

  if (!apiInfo) {
    logger.error("No api info found in database");
    return null;
  }

  return {
    buildNumber: apiInfo.build_number,
    version: apiInfo.version,
  };
};

// Summary: fetch roles
export const getRoles: QueryResolvers["roles"] = async (
  _,
  __,
  context,
): Promise<Maybe<RoleType[]>> => {
  await requireUserSession(context);
  return [
    {
      id: "1",
      name: "Staff",
      scope: ScopeEnum.Organisation,
    },
    {
      id: "2",
      name: "Administrator",
      scope: ScopeEnum.Organisation,
    },
  ];
};

// Summary: fetch roles
export const getConfig: QueryResolvers["config"] = async (
  _,
  __,
  context,
): Promise<ConfigData> => {
  await requireUserSession(context);
  return {
    envName: "sandbox",
    mapboxToken: "",
    mapboxStyle: "mapbox://styles/abodsproduct/cly75mrer00e101pi0u934ipk",
    mapboxSatelliteStyle:
      "mapbox://styles/abodsproduct/cly75o0ex00ey01nw53xg1bk9",
    vehicleJourneys: {
      validDateRange: {
        offsetISO: "PT0H",
        durationISO: "P6M",
      },
    },
    otp: {
      early: 1,
      late: 6,
    },
    freshdesk: {
      apiUrl: "https://sandbox.analyse-tmp.bus-data.dft.gov.uk/freshdesk/",
      folders: {
        dashboard: "43000590095",
        feedMonitoring: "43000590096",
        otp: "43000590097",
        vehicleJourneys: "43000590098",
        corridors: "43000590099",
        organisation: "43000590100",
      },
    },
  };
};

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: getApiInfo,
    roles: getRoles,
    config: getConfig,
  },
};

export default sharedResolvers;
