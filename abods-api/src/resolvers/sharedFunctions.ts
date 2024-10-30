import { QueryResolvers, Resolvers } from '../types/generated.js'
import { requireUserSession } from './helpers';

// Summary: fetch api info
export const getApiInfo: QueryResolvers['apiInfo'] = async (_, __, context) => {
  try {
    const apiInfo = await context.db.prisma.apiInfo.findFirst({
      include: {
        feature_flag: true
      }
    });

    if(!apiInfo){
      throw("No api info found")
    }

    return {
      buildNumber: apiInfo.build_number,
      timezone: apiInfo.timezone,
      version: apiInfo.version,
      featureFlags: {
        consolidateHistogram: apiInfo.feature_flag?.consolidate_histogram,
        corridorStatsTimezoneEnabled: apiInfo.feature_flag?.corridor_stats_timezone_enabled,
        freshdeskEnabled: apiInfo.feature_flag?.freshdesk_enabled,
        lineDirectionFiltering: apiInfo.feature_flag?.line_direction_filtering,
        ssoEnabled: apiInfo.feature_flag?.sso_enabled,
        stopIndexFiltering: apiInfo.feature_flag?.stop_index_filtering,
        taggingIncludeBankHolidays: apiInfo.feature_flag?.tagging_include_bank_holidays,
        vehicleReplayFromTimestream: apiInfo.feature_flag?.vehicle_replay_from_timestream,
      }
    };

  } catch (error) {
    console.error(error)
    return null;
  } 
}

// Summary: fetch roles
export const getRoles: QueryResolvers['roles'] = async (_, __, context ) => {
  try {
    await requireUserSession(context)

    return [{
      "id": "1",
      "name": "Staff",
      "scope": "organisation"
    },
    {
      "id": "2",
      "name": "Administrator",
      "scope": "organisation"
    },
  ]

  } catch (error) {
    console.error(error)
    return null;
  } 
}

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: getApiInfo,
    roles: getRoles
  }
}

export default sharedResolvers;
