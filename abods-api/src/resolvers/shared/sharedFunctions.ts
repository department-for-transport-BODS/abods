import { Role } from '@prisma/client';
import { Context } from '../../context.js';
import { RoleType, ScopeEnum } from '../../types/generated.js'

const adminAreas = [
  {
    "adminAreaId": "area1",
    "adminAreaName": "Area1Name"
  },
  {
    "adminAreaId": "area2",
    "adminAreaName": "Area2Name"
  }
]

export const getOrganisation = async (id, sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    if(!id)
    {
      throw("Invalid Id")
    }

    //TODO: check if user is part of org

    const org = await db.prisma.bods_organisation.findUnique({where:{id:id}});

    if(!org){
      throw("No organisation found")
    }

    return org;

  } catch (error) {
    console.error(error)
    return null;
  }
}

// Summary: fetch api info
export const getApiInfo = async (db: Context) => {
  try {
    const apiInfo = await db.prisma.apiInfo.findFirst({
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
export const getRoles = async (sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

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

export const mapRoleToRoleType = (role: Role): RoleType | undefined => {
  return {
    id: String(role.id),
    name: role.name.trim(),
    scope: role.scope.trim() as ScopeEnum
  }
}
