import { PrismaClient } from "@prisma/client";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely } from "kysely";
import { DB } from "../kysely";
import { getKyselyClient } from "../kyselyClient";
import { initialisePrismaClient } from "../prismaClient";
import {
  createBodsOrganisationOperatorTable,
  createBodsOrganisationTable,
  createBodsUserOrganisationTable,
  createBodsUserTable,
  createCorridorStopsTable,
  createCorridorTable,
  createDistinctRoutesTable,
  createLoginDetailsTable,
  createNaptanAdminareaTable,
  createNaptanLocalityTable,
  createNaptanStoppointLatlongTable,
  createNocAdminareaTable,
  createRouteToJourneysTable,
  createTimetableTable,
  createTokensTable,
} from "./dbKysely";
import argon2 from "argon2";
import { GraphQLResponse } from "@apollo/server";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../types/extra";

export const setEnvVariables = (container: StartedPostgreSqlContainer) => {
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort().toString();
  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_NAME = container.getDatabase();
  process.env.PROJECT_ENV = "local";
  process.env.DATABASE_URL = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`;
};

export const connectPrisma = async (dbPrisma: PrismaClient) => {
  dbPrisma = await initialisePrismaClient();
  await dbPrisma.$connect();
  return dbPrisma;
};

export const connectKysely = async (dbKysely: Kysely<DB>) => {
  dbKysely = await getKyselyClient();
  if (!dbKysely) throw new Error("Kysely client not initialized");
  return dbKysely;
};

export const createUserTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createBodsUserTable(dbKysely),
    createBodsOrganisationTable(dbKysely),
    createBodsUserOrganisationTable(dbKysely),
    createTokensTable(dbKysely),
    createLoginDetailsTable(dbKysely),
    createBodsOrganisationOperatorTable(dbKysely),
  ]);

  const passwordHash = await argon2.hash("hashedpassword");

  await Promise.all([
    dbKysely
      .insertInto("bods_user")
      .values({
        id: 1,
        username: "testuser",
        email: "test@dft.gov.uk",
        password: passwordHash,
        is_active: true,
        is_superuser: false,
        account_type: 1,
        admin_org: 1,
        first_name: "Test",
        last_name: "User",
      })
      .execute(),
    dbKysely
      .insertInto("Tokens")
      .values({
        token: "test-session-id",
        user_id: 1,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      })
      .execute(),
    dbKysely
      .insertInto("bods_organisation")
      .values({
        id: 1,
        name: "Test Org",
        is_abods_global_viewer: true,
      })
      .execute(),
    dbKysely
      .insertInto("bods_userorganisation")
      .values({
        user_id: 1,
        organisation_id: 1,
      })
      .execute(),
    dbKysely
      .insertInto("login_details")
      .values({
        user_id: 1,
        last_login: new Date(),
        data_monitoring_access_count: 0,
        data_monitoring_access_refresh: new Date(),
      })
      .execute(),
    dbKysely
      .insertInto("bods_organisationoperator")
      .values([
        { organisation_id: 1, operatorref: "OP1" },
        { organisation_id: 1, operatorref: "OP2" },
        { organisation_id: 2, operatorref: "OP3" },
      ])
      .execute(),
  ]);
};

export const createCorridorTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createCorridorTable(dbKysely),
    createCorridorStopsTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("corridor")
      .values({
        corridor_id: 1,
        corridor_name: "Test Corridor",
        organisation_id: 1,
        user_id: 1,
      })
      .execute(),
    dbKysely
      .insertInto("corridor_stops")
      .values([
        {
          corridor_id: 1,
          corridor_index: 0,
          stop_id: 1,
        },
        {
          corridor_id: 1,
          corridor_index: 1,
          stop_id: 2,
        },
      ])
      .execute(),
  ]);
};

export const createTimetableTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([createTimetableTable(dbKysely)]);

  await dbKysely
    .insertInto("Timetable")
    .values([
      {
        timetable_id: "tt1",
        operator_noc: "OP1",
        operator_name: "Operator One",
        service_code: "SVC1",
        line_name: "Line 1",
        xml_file_name: "file1.xml",
        journey_code: "JCODE1",
        date_of_journey: new Date("2025-10-17T08:00:00Z"),
        day_of_week: 5,
        common_name: "Main Street Stop",
        atco_code: "12345",
        stop_type: "bus",
        stop_index: 0,
        stop_latitude: 51.54321,
        stop_longitude: -0.12345,
        locality_id: "LOC001",
        expected_departure_time: new Date("2025-10-17T08:05:00Z"),
        actual_departure_time: new Date("2025-10-17T08:06:00Z"),
        is_timing_point: true,
        group_id: "groupA",
        previous_group_id: null,
        otp_state: null,
        expected_headway: null,
        actual_headway: null,
        headway_time_difference: null,
        time_difference: null,
        stop_id: 1,
        load_time_stamp: null,
        off_set: null,
        servicepattern_id: null,
        vehiclejourney_id: 101,
        admin_area_id: 10,
        timestamp_after_estimate: null,
        direction: "outbound",
        departure_day_shift: false,
        siri_vm_position_id: null,
        incomplete_reason: null,
        set_down: false,
      },
      {
        timetable_id: "tt2",
        operator_noc: "OP1",
        operator_name: "Operator One",
        service_code: "SVC1",
        line_name: "Line 1",
        xml_file_name: "file1.xml",
        journey_code: "JCODE1",
        date_of_journey: new Date("2025-10-17T08:00:00Z"),
        day_of_week: 5,
        common_name: "Another Street Stop",
        atco_code: "12346",
        stop_type: "bus",
        stop_index: 1,
        stop_latitude: 51.54321,
        stop_longitude: -0.12345,
        locality_id: "LOC001",
        expected_departure_time: new Date("2025-10-17T08:10:00Z"),
        actual_departure_time: new Date("2025-10-17T08:11:00Z"),
        is_timing_point: true,
        group_id: "groupA",
        previous_group_id: null,
        otp_state: null,
        expected_headway: null,
        actual_headway: null,
        headway_time_difference: null,
        time_difference: null,
        stop_id: 2,
        load_time_stamp: null,
        off_set: null,
        servicepattern_id: null,
        vehiclejourney_id: 101,
        admin_area_id: 10,
        timestamp_after_estimate: null,
        direction: "outbound",
        departure_day_shift: false,
        siri_vm_position_id: null,
        incomplete_reason: null,
        set_down: false,
      },
    ])
    .execute();
};

export const createRouteTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createNocAdminareaTable(dbKysely),
    createDistinctRoutesTable(dbKysely),
    createRouteToJourneysTable(dbKysely),
  ]);
  await Promise.all([
    dbKysely
      .insertInto("noc_adminarea")
      .values([
        { national_operator_code: "OP1", adminarea_id: 10 },
        { national_operator_code: "OP2", adminarea_id: 10 },
        { national_operator_code: "OP3", adminarea_id: 20 },
      ])
      .execute(),
    dbKysely
      .insertInto("distinct_routes")
      .values([
        { route: "12345,12346,12347" },
        { route: "12345,12348,12349" },
        { route: "12346,12350,12351" },
      ])
      .execute(),
    dbKysely
      .insertInto("route_to_journeys")
      .values([
        {
          id: "journey1",
          group_id: "groupA",
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          distinct_route_id: 1,
        },
        {
          id: "journey2",
          group_id: "groupB",
          date_of_journey: new Date("2025-10-17T09:00:00Z"),
          distinct_route_id: 2,
        },
        {
          id: "journey3",
          group_id: "groupA",
          date_of_journey: new Date("2025-10-18T08:00:00Z"),
          distinct_route_id: 1,
        },
      ])
      .execute(),
  ]);
};

export const createNaptanTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createNaptanStoppointLatlongTable(dbKysely),
    createNaptanLocalityTable(dbKysely),
    createNaptanAdminareaTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("naptan_stoppoint_latlong")
      .values([
        {
          id: 1,
          atco_code: "12345",
          naptan_code: "NPT001",
          common_name: "Main Street Stop",
          street: "Main Street",
          indicator: "A",
          admin_area_id: 10,
          locality_id: "LOC001",
          stop_areas: ["AREA1", "AREA2"], // Array of strings
          bus_stop_type: "local",
          stop_type: "bus",
          longitude: -0.12345,
          latitude: 51.54321,
        },
        {
          id: 2,
          atco_code: "12346",
          naptan_code: "NPT002",
          common_name: "Another Street Stop",
          street: "Another Street",
          indicator: "A",
          admin_area_id: 10,
          locality_id: "LOC001",
          stop_areas: ["AREA1", "AREA2"], // Array of strings
          bus_stop_type: "local",
          stop_type: "bus",
          longitude: -0.12345,
          latitude: 51.54321,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("naptan_locality")
      .values({
        gazetteer_id: "LOC001",
        name: "Central Locality",
        easting: 123456,
        northing: 654321,
        admin_area_id: "10",
        district_id: 10,
      })
      .execute(),
    dbKysely
      .insertInto("naptan_adminarea")
      .values({
        id: "10",
        name: "Test Admin Area",
        traveline_region_id: "TR1",
        atco_code: "ATCO10",
        ui_lta_id: 100,
      })
      .execute(),
  ]);
};

export const getContext = (
  dbPrisma: PrismaClient,
  dbKysely: Kysely<DB>,
): RequestContext => ({
  db: dbPrisma,
  kysely: dbKysely,
  apiKeyAuth: undefined,
  headers: {
    cookie: "abods_sessionid=test-session-id", // <-- Pass the session cookie here
  },
  req: createRequest(),
  res: createResponse(),
});

export const getSingleResultData = <T>(
  response: GraphQLResponse<Record<string, unknown>>,
) => {
  if (response.body.kind === "single") {
    return response.body.singleResult.data as T;
  }
  return undefined;
};
