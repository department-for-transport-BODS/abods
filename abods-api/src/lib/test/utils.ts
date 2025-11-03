import { PrismaClient } from "@prisma/client";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, sql } from "kysely";
import { DB } from "../../kysely";
import { getKyselyClient } from "../../kyselyClient";
import { initialisePrismaClient } from "../../prismaClient";

import { GraphQLResponse } from "@apollo/server";
import argon2 from "argon2";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../../types/extra";
import {
  createAllOperatorsTable,
  createBodsOrganisationOperatorTable,
  createBodsOrganisationTable,
  createBodsUserOrganisationTable,
  createBodsUserTable,
  createCorridorStopsTable,
  createCorridorTable,
  createDistinctRoutesTable,
  createExpectedJourneysTable,
  createExpectedOperatorsTable,
  createExpectedServicesTable,
  createFeedMonitorDailySummaryTable,
  createFeedMonitorHourlySummaryTable,
  createFeedMonitorMinuteSummaryTable,
  createFeedMonitorSummaryTable,
  createLoginDetailsTable,
  createNaptanAdminareaTable,
  createNaptanAdminareaWithShapeTable,
  createNaptanLocalityTable,
  createNaptanStoppointLatlongTable,
  createNocAdminareaTable,
  createPerformanceStatisticsTable,
  createRouteToJourneysTable,
  createServiceDetailsTable,
  createServicepatternRouteTable,
  createSiriVMPositionsTable,
  createTimetableFrequentSummaryServicesTable,
  createTimetableSummaryOperatorTTable,
  createTimetableSummaryServiceTzTable,
  createTimetableSummaryStopsTzTable,
  createTimetableTable,
  createTimetableThresholdSummaryTable,
  createTokensTable,
  createTransmodelServicepatterndistanceTable,
  createTransmodelTracksTable,
  createTransmodelVehiclejourneyTable,
} from "./db";

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

export const createSummaryTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createTimetableSummaryOperatorTTable(dbKysely),
    createTimetableSummaryServiceTzTable(dbKysely),
    createTimetableThresholdSummaryTable(dbKysely),
    createPerformanceStatisticsTable(dbKysely),
  ]);
  await Promise.all([
    dbKysely
      .insertInto("timetable_summary_operator_t")
      .values([
        {
          timetable_id: "200",
          operator_noc: "OP1",
          date_of_journey: new Date("2025-10-20T08:00:00Z"),
          departure_hour: new Date("2025-10-20T08:00:00Z"),
          departure_hour_only: new Date("2025-10-20T08:00:00Z"),
          day_of_week: 1,
          on_time_count: 5,
          early_count: 1,
          late_count: 2,
          completed: 8,
          scheduled: 8,
          is_timing_point: true,
          max_early: 2,
          max_late: 5,
          avg_time_difference: "3",
          admin_areas: [10],
          estimated: false,
          incomplete_reason: null,
          count_delayed: 2,
          average_delay: 2,
        },
        {
          timetable_id: "201",
          operator_noc: "OP1",
          date_of_journey: new Date("2025-10-20T08:00:00Z"),
          departure_hour: new Date("2025-10-20T08:00:00Z"),
          departure_hour_only: new Date("2025-10-20T08:00:00Z"),
          day_of_week: 1,
          on_time_count: 3,
          early_count: 0,
          late_count: 1,
          completed: 4,
          scheduled: 4,
          is_timing_point: true,
          max_early: 1,
          max_late: 4,
          avg_time_difference: "2",
          admin_areas: [10],
          estimated: false,
          incomplete_reason: null,
          count_delayed: 1,
          average_delay: 1,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("timetable_summary_service_tz")
      .values([
        {
          timetable_id: "300",
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          date_of_journey: new Date("2025-10-20T08:00:00Z"),
          departure_hour: new Date("2025-10-20T08:00:00Z"),
          departure_hour_only: new Date("2025-10-20T08:00:00Z"),
          day_of_week: 1,
          on_time_count: 10,
          early_count: 2,
          late_count: 3,
          completed: 15,
          scheduled: 15,
          is_timing_point: true,
          max_early: 3,
          max_late: 6,
          avg_time_difference: "4",
          admin_areas: [10],
          estimated: false,
          incomplete_reason: null,
          direction: "Inbound",
          count_delayed: 3,
          average_delay: 3,
        },
        {
          timetable_id: "301",
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          date_of_journey: new Date("2025-10-20T09:00:00Z"),
          departure_hour: new Date("2025-10-20T09:00:00Z"),
          departure_hour_only: new Date("2025-10-20T09:00:00Z"),
          day_of_week: 1,
          on_time_count: 8,
          early_count: 1,
          late_count: 2,
          completed: 11,
          scheduled: 11,
          is_timing_point: true,
          max_early: 2,
          max_late: 5,
          avg_time_difference: "3",
          admin_areas: [10],
          estimated: false,
          incomplete_reason: null,
          direction: "Outbound",
          count_delayed: 2,
          average_delay: 2,
        },
        {
          timetable_id: "302",
          operator_noc: "OP2",
          line_name: "L2",
          noc_and_line_and_servicecode: "OP2-L2-SC2",
          date_of_journey: new Date("2025-10-21T08:00:00Z"),
          departure_hour: new Date("2025-10-21T08:00:00Z"),
          departure_hour_only: new Date("2025-10-21T08:00:00Z"),
          day_of_week: 2,
          on_time_count: 12,
          early_count: 3,
          late_count: 1,
          completed: 16,
          scheduled: 16,
          is_timing_point: true,
          max_early: 4,
          max_late: 4,
          avg_time_difference: "2",
          admin_areas: [20],
          estimated: false,
          incomplete_reason: null,
          direction: "Inbound",
          count_delayed: 1,
          average_delay: 1,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("timetable_threshold_summary")
      .values([
        {
          threshold_id: "thresh-1",
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          date_of_journey: new Date("2025-10-20T08:00:00Z"),
          is_timing_point: true,
          time_diff_minutes: 3,
          departure_hour: new Date("2025-10-20T08:00:00Z"),
          admin_areas: [10],
          otp_count: 5,
          day_of_week: 1,
          estimated: false,
          departure_hour_only: new Date("2025-10-20T08:00:00Z"),
        },
        {
          threshold_id: "thresh-2",
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          date_of_journey: new Date("2025-10-20T09:00:00Z"),
          is_timing_point: true,
          time_diff_minutes: 2,
          departure_hour: new Date("2025-10-20T09:00:00Z"),
          admin_areas: [10],
          otp_count: 4,
          day_of_week: 1,
          estimated: false,
          departure_hour_only: new Date("2025-10-20T09:00:00Z"),
        },
        {
          threshold_id: "thresh-3",
          operator_noc: "OP2",
          line_name: "L2",
          noc_and_line_and_servicecode: "OP2-L2-SC2",
          service_name: "Operator Two",
          date_of_journey: new Date("2025-10-21T08:00:00Z"),
          is_timing_point: true,
          time_diff_minutes: 4,
          departure_hour: new Date("2025-10-21T08:00:00Z"),
          admin_areas: [20],
          otp_count: 6,
          day_of_week: 2,
          estimated: false,
          departure_hour_only: new Date("2025-10-21T08:00:00Z"),
        },
      ])
      .execute(),
    dbKysely
      .insertInto("performance_statistics")
      .values([
        {
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          is_timing_point: true,
          date_period_start: new Date("2025-10-15T00:00:00Z"),
          date_period_end: new Date("2025-10-20T23:59:59Z"),
          period_type: "last_7_days",
          on_time_count: 10,
          early_count: 2,
          late_count: 3,
          total_count: 15,
          on_time_percentage: "66.7",
          trend_period_start: new Date("2025-10-07T00:00:00Z"),
          trend_period_end: new Date("2025-10-13T23:59:59Z"),
          trend_on_time_count: 8,
          trend_early_count: 1,
          trend_late_count: 2,
          trend_total_count: 11,
          trend_percentage: "72.7",
          percentage_change: "-6.0",
        },
        {
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          is_timing_point: true,
          date_period_start: new Date("2025-10-15T00:00:00Z"),
          date_period_end: new Date("2025-10-21T23:59:59Z"),
          period_type: "last_7_days",
          on_time_count: 12,
          early_count: 1,
          late_count: 2,
          total_count: 15,
          on_time_percentage: "80.0",
          trend_period_start: new Date("2025-10-07T00:00:00Z"),
          trend_period_end: new Date("2025-10-13T23:59:59Z"),
          trend_on_time_count: 10,
          trend_early_count: 2,
          trend_late_count: 3,
          trend_total_count: 15,
          trend_percentage: "66.7",
          percentage_change: "+13.3",
        },
        {
          operator_noc: "OP2",
          line_name: "L2",
          noc_and_line_and_servicecode: "OP2-L2-SC2",
          service_name: "Operator Two",
          is_timing_point: true,
          date_period_start: new Date("2025-10-15T00:00:00Z"),
          date_period_end: new Date("2025-10-20T23:59:59Z"),
          period_type: "last_7_days",
          on_time_count: 14,
          early_count: 0,
          late_count: 2,
          total_count: 16,
          on_time_percentage: "87.5",
          trend_period_start: new Date("2025-10-07T00:00:00Z"),
          trend_period_end: new Date("2025-10-13T23:59:59Z"),
          trend_on_time_count: 12,
          trend_early_count: 1,
          trend_late_count: 1,
          trend_total_count: 14,
          trend_percentage: "85.7",
          percentage_change: "+1.8",
        },
      ])
      .execute(),
  ]);
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

export const createOperatorsAndServiceDetails = async (
  dbKysely: Kysely<DB>,
) => {
  await Promise.all([
    createServiceDetailsTable(dbKysely),
    createAllOperatorsTable(dbKysely),
  ]);
  await Promise.all([
    dbKysely
      .insertInto("service_details")
      .values([
        {
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          operator_noc: "OP1",
          line_name: "L1",
          service_name: "Operator One",
          admin_areas: [10], // matches admin_area_id in Timetable data
          license: "Standard License",
        },
      ])
      .execute(),
    dbKysely
      .insertInto("all_operators")
      .values({
        operatorid: 1,
        operatorref: "OP1",
        name: "Operator One",
      })
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

  await sql`SELECT setval(pg_get_serial_sequence('corridor', 'corridor_id'), (SELECT MAX(corridor_id) FROM corridor))`.execute(
    dbKysely,
  );
};

export const createTimetableTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createTimetableTable(dbKysely),
    createSiriVMPositionsTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("SiriVMPositions")
      .values([
        {
          siri_vm_positions_id: "vmpos-1",
          operator_ref: "OP1",
          line_name: "L1",
          journey_ref: "JCODE1",
          direction_ref: "outbound",
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          latitude: 51.54321,
          longitude: -0.12345,
          vehicle_ref: "VEH1",
          batch_id: "batchA",
          recorded_at_time: new Date("2025-10-17T08:05:00Z"),
          response_time_stamp: new Date("2025-10-17T08:05:10Z"),
          load_time_stamp: new Date("2025-10-17T08:05:20Z"),
          group_id: "op1|L1|SC1|2025-10-17",
          origin_ref: "12345",
          destination_ref: "12346",
          departure_time: new Date("2025-10-17T08:05:00Z"),
        },
        {
          siri_vm_positions_id: "vmpos-2",
          operator_ref: "OP1",
          line_name: "L1",
          journey_ref: "JCODE1",
          direction_ref: "outbound",
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          latitude: 51.54321,
          longitude: -0.12345,
          vehicle_ref: "VEH1",
          batch_id: "batchA",
          recorded_at_time: new Date("2025-10-17T08:10:00Z"),
          response_time_stamp: new Date("2025-10-17T08:10:10Z"),
          load_time_stamp: new Date("2025-10-17T08:10:20Z"),
          group_id: "op1|L1|SC1|2025-10-17",
          origin_ref: "12346",
          destination_ref: "12345",
          departure_time: new Date("2025-10-17T08:10:00Z"),
        },
      ])
      .execute(),
    dbKysely
      .insertInto("Timetable")
      .values([
        {
          timetable_id: "100",
          operator_noc: "OP1",
          operator_name: "Operator One",
          service_code: "SC1",
          line_name: "L1",
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
          group_id: "op1|L1|SC1|2025-10-17",
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
          timetable_id: "101",
          operator_noc: "OP1",
          operator_name: "Operator One",
          service_code: "SC1",
          line_name: "L1",
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
          group_id: "op1|L1|SC1|2025-10-17",
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
        {
          timetable_id: "201",
          operator_noc: "OP1",
          operator_name: "Operator One",
          service_code: "SC1",
          line_name: "L1",
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
          group_id: "op1|L1|SC1|2025-10-18",
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
      .execute(),
  ]);
};

export const createExpectedTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createExpectedServicesTable(dbKysely),
    createExpectedJourneysTable(dbKysely),
    createExpectedOperatorsTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("expected_services")
      .values([
        {
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          operator_noc: "OP1",
          admin_area_id: [10], // matches admin_area_id in Timetable data
          total_distance: 2000,
          avl_true_distance: 1950,
          license: "Standard License",
        },
        {
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          service_name: "Operator One",
          date_of_journey: new Date("2025-10-18T08:00:00Z"),
          operator_noc: "OP1",
          admin_area_id: [10],
          total_distance: 2100,
          avl_true_distance: 2050,
          license: "Standard License",
        },
        {
          line_name: "L2",
          noc_and_line_and_servicecode: "OP2-L2-SC2",
          service_name: "Operator Two",
          date_of_journey: new Date("2025-10-21T09:00:00Z"),
          operator_noc: "OP2",
          admin_area_id: [20],
          total_distance: 1800,
          avl_true_distance: 1750,
          license: "Premium License",
        },
      ])
      .execute(),
    dbKysely
      .insertInto("expected_journeys")
      .values([
        {
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          journey_code: "JCODE1",
          group_id: "groupA",
          stop_count: 2,
          expected_journey_start: new Date("2025-10-17T08:05:00Z"),
          journey_pattern_description: "Main Street to Another Street",
          vehicle_journey_id: 101,
          day_of_week: 5,
          admin_area_id: [10],
          expected_journey_end: new Date("2025-10-17T08:10:00Z"),
          direction: "outbound",
          is_cancelled: false,
        },
        {
          date_of_journey: new Date("2025-10-18T08:00:00Z"),
          operator_noc: "OP1",
          line_name: "L1",
          noc_and_line_and_servicecode: "OP1-L1-SC1",
          journey_code: "JCODE1",
          group_id: "groupA",
          stop_count: 2,
          expected_journey_start: new Date("2025-10-18T08:05:00Z"),
          journey_pattern_description: "Main Street to Another Street",
          vehicle_journey_id: 101,
          day_of_week: 6,
          admin_area_id: [10],
          expected_journey_end: new Date("2025-10-18T08:10:00Z"),
          direction: "outbound",
          is_cancelled: false,
        },
        {
          date_of_journey: new Date("2025-10-21T09:00:00Z"),
          operator_noc: "OP2",
          line_name: "L2",
          noc_and_line_and_servicecode: "OP2-L2-SC2",
          journey_code: "JCODE2",
          group_id: "groupB",
          stop_count: 3,
          expected_journey_start: new Date("2025-10-21T09:05:00Z"),
          journey_pattern_description: "North District Route",
          vehicle_journey_id: 201,
          day_of_week: 2,
          admin_area_id: [20],
          expected_journey_end: new Date("2025-10-21T09:20:00Z"),
          direction: "inbound",
          is_cancelled: false,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("expected_operators")
      .values([
        {
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          operator_noc: "OP1",
          operator_name: "Operator One",
        },
        {
          date_of_journey: new Date("2025-10-18T08:00:00Z"),
          operator_noc: "OP1",
          operator_name: "Operator One",
        },
        {
          date_of_journey: new Date("2025-10-21T09:00:00Z"),
          operator_noc: "OP2",
          operator_name: "Operator Two",
        },
      ])
      .execute(),
  ]);
};

export const createRouteTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createNocAdminareaTable(dbKysely),
    createDistinctRoutesTable(dbKysely),
    createRouteToJourneysTable(dbKysely),
    createTransmodelTracksTable(dbKysely),
    createServicepatternRouteTable(dbKysely),
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
          group_id: "op1|L1|SC1|2025-10-17",
          date_of_journey: new Date("2025-10-17T08:00:00Z"),
          distinct_route_id: 1,
        },
        {
          id: "journey2",
          group_id: "op1|L1|SC1|2025-10-18",
          date_of_journey: new Date("2025-10-17T09:00:00Z"),
          distinct_route_id: 2,
        },
        {
          id: "journey3",
          group_id: "op1|L1|SC1|2025-10-17",
          date_of_journey: new Date("2025-10-18T08:00:00Z"),
          distinct_route_id: 1,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("transmodel_tracks")
      .values([
        {
          id: "track1",
          from_atco_code: "12345", // Main Street Stop
          to_atco_code: "12346", // Another Street Stop
          geometry: JSON.stringify({
            type: "LineString",
            coordinates: [
              [-0.12345, 51.54321],
              [-0.12345, 51.54321],
            ],
          }),
          distance: 1000,
        },
        {
          id: "track2",
          from_atco_code: "12346",
          to_atco_code: "12347",
          geometry: JSON.stringify({
            type: "LineString",
            coordinates: [
              [-0.12345, 51.54321],
              [-0.12345, 51.54321],
            ],
          }),
          distance: 800,
        },
        {
          id: "track3",
          from_atco_code: "12345",
          to_atco_code: "12348",
          geometry: JSON.stringify({
            type: "LineString",
            coordinates: [
              [-0.12345, 51.54321],
              [-0.12345, 51.54321],
            ],
          }),
          distance: 1200,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("servicepattern_route")
      .values([
        {
          distinct_route_id: 1,
          noc_and_line_and_servicecode: "OP1-L1-SC1",
        },
        {
          distinct_route_id: 2,
          noc_and_line_and_servicecode: "OP1-L1-SC1",
        },
        {
          distinct_route_id: 3,
          noc_and_line_and_servicecode: "OP2-L2-SC2",
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
    createNaptanAdminareaWithShapeTable(dbKysely),
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
    dbKysely
      .insertInto("naptan_adminarea_with_shape")
      .values([
        {
          id: 10,
          name: "Central City",
          atco_code: "ATCO1",
          st_asgeojson:
            '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}',
        },
        {
          id: 20,
          name: "North District",
          atco_code: "ATCO2",
          st_asgeojson:
            '{"type":"Polygon","coordinates":[[[2,2],[3,2],[3,3],[2,3],[2,2]]]}',
        },
        {
          id: 30,
          name: "South Borough",
          atco_code: "ATCO3",
          st_asgeojson:
            '{"type":"Polygon","coordinates":[[[4,4],[5,4],[5,5],[4,5],[4,4]]]}',
        },
      ])
      .execute(),
  ]);
};

export const createTimetableSummaryStopsTableAndData = async (
  dbKysely: Kysely<DB>,
) => {
  await createTimetableSummaryStopsTzTable(dbKysely);

  // Insert test data matching operator, noc_and_line_and_servicecode, stops, and date
  await dbKysely
    .insertInto("timetable_summary_stops_tz")
    .values([
      {
        timetable_id: "200",
        operator_noc: "OP1",
        service_code: "SC1",
        noc_and_line_and_servicecode: "OP1-L1-SC1",
        stop_id: 1,
        locality_id: "LOC001",
        line_name: "Line 1",
        stop_latitude: 51.54321,
        stop_longitude: -0.12345,
        date_of_journey: new Date("2025-10-20T08:00:00Z"),
        departure_hour: new Date("2025-10-20T08:00:00Z"),
        departure_hour_only: new Date("2025-10-20T08:00:00Z"),
        day_of_week: 1,
        on_time_count: 3,
        early_count: 1,
        late_count: 1,
        completed: 5,
        scheduled: 5,
        common_name: "Main Street Stop",
        is_timing_point: true,
        max_early: 2,
        max_late: 5,
        avg_time_difference: "3",
        estimated: false,
        incomplete_reason: null,
        direction: "outbound",
        stop_index: 0,
        count_delayed: 1,
        average_delay: 2,
        diff_sched_time_to_stop: 0,
        diff_sched_time_to_stop_timing_point: 0,
        diff_actual_time_to_stop: 0,
        diff_actual_time_to_stop_timing_point: 0,
      },
      {
        timetable_id: "201",
        operator_noc: "OP1",
        service_code: "SC1",
        noc_and_line_and_servicecode: "OP1-L1-SC1",
        stop_id: 2,
        locality_id: "LOC001",
        line_name: "Line 1",
        stop_latitude: 51.54321,
        stop_longitude: -0.12345,
        date_of_journey: new Date("2025-10-20T08:00:00Z"),
        departure_hour: new Date("2025-10-20T08:00:00Z"),
        departure_hour_only: new Date("2025-10-20T08:00:00Z"),
        day_of_week: 1,
        on_time_count: 2,
        early_count: 0,
        late_count: 2,
        completed: 4,
        scheduled: 4,
        common_name: "Another Street Stop",
        is_timing_point: true,
        max_early: 2,
        max_late: 5,
        avg_time_difference: "3",
        estimated: false,
        incomplete_reason: null,
        direction: "outbound",
        stop_index: 1,
        count_delayed: 1,
        average_delay: 2,
        diff_sched_time_to_stop: 0,
        diff_sched_time_to_stop_timing_point: 0,
        diff_actual_time_to_stop: 0,
        diff_actual_time_to_stop_timing_point: 0,
      },
    ])
    .execute();
};

export const createFrequentSummariesTableAndData = async (
  dbKysely: Kysely<DB>,
) => {
  await createTimetableFrequentSummaryServicesTable(dbKysely);

  await dbKysely
    .insertInto("timetable_frequent_summary_services")
    .values([
      {
        timetable_id: "200",
        operator_noc: "OP1",
        service_code: "SC1",
        noc_and_line_and_servicecode: "OP1-L1-SC1",
        line_name: "Line 1",
        date_of_journey: new Date("2025-10-20T08:00:00Z"),
        departure_hour: new Date("2025-10-20T08:00:00Z"),
        departure_hour_only: new Date("2025-10-20T08:00:00Z"),
        day_of_week: 1,
        max_early: 2,
        max_late: 5,
        avg_time_difference: "3",
        expected_headway: "10",
        actual_headway: "12",
        excess_wait_time: "2",
        headway_stops_count: "5",
        estimated: false,
        is_timing_point: true,
      },
      {
        timetable_id: "201",
        operator_noc: "OP2",
        service_code: "SC2",
        noc_and_line_and_servicecode: "OP2-L2-SC2",
        line_name: "Line 2",
        date_of_journey: new Date("2025-10-21T09:00:00Z"),
        departure_hour: new Date("2025-10-21T09:00:00Z"),
        departure_hour_only: new Date("2025-10-21T09:00:00Z"),
        day_of_week: 2,
        max_early: 1,
        max_late: 4,
        avg_time_difference: "2",
        expected_headway: "8",
        actual_headway: "9",
        excess_wait_time: "1",
        headway_stops_count: "4",
        estimated: true,
        is_timing_point: false,
      },
    ])
    .execute();
};

export const createTransmodelTablesAndData = async (dbKysely: Kysely<DB>) => {
  await Promise.all([
    createTransmodelVehiclejourneyTable(dbKysely),
    createTransmodelServicepatterndistanceTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("transmodel_vehiclejourney")
      .values([
        {
          id: "101",
          start_time: new Date("2025-10-17T08:05:00Z"),
          direction: "outbound",
          journey_code: "JCODE1",
          line_ref: "L1",
          departure_day_shift: false,
          service_pattern_id: 1001,
          block_number: "blockA",
        },
        {
          id: "201",
          start_time: new Date("2025-10-21T09:05:00Z"),
          direction: "inbound",
          journey_code: "JCODE2",
          line_ref: "L2",
          departure_day_shift: false,
          service_pattern_id: 2001,
          block_number: "blockB",
        },
      ])
      .execute(),
    dbKysely
      .insertInto("transmodel_servicepatterndistance")
      .values([
        {
          service_pattern_id: 1001,
          distance: 1500,
          geom: '{"type":"LineString","coordinates":[[-0.12345,51.54321],[-0.12350,51.54325]]}',
        },
        {
          service_pattern_id: 2001,
          distance: 2200,
          geom: '{"type":"LineString","coordinates":[[-0.22345,51.64321],[-0.22350,51.64325]]}',
        },
      ])
      .execute(),
  ]);
};

export const createFeedMonitoringTablesAndData = async (
  dbKysely: Kysely<DB>,
) => {
  await Promise.all([
    createFeedMonitorDailySummaryTable(dbKysely),
    createFeedMonitorSummaryTable(dbKysely),
    createFeedMonitorHourlySummaryTable(dbKysely),
    createFeedMonitorMinuteSummaryTable(dbKysely),
  ]);

  await Promise.all([
    dbKysely
      .insertInto("feed_monitor_summary")
      .values([
        {
          id: "1",
          operator_noc: "OP1",
          last_outage: new Date("2025-10-15T12:00:00Z"),
          unavailable_since: new Date("2025-10-15T11:30:00Z"),
          update_frequency: 15,
          availability: "0.1",
        },
        {
          id: "2",
          operator_noc: "OP2",
          last_outage: new Date("2025-10-16T14:00:00Z"),
          unavailable_since: new Date("2025-10-16T13:45:00Z"),
          update_frequency: 10,
          availability: "0.2",
        },
        {
          id: "3",
          operator_noc: "OP3",
          last_outage: new Date("2025-10-17T09:00:00Z"),
          unavailable_since: new Date("2025-10-17T08:50:00Z"),
          update_frequency: 20,
          availability: "0.3",
        },
      ])
      .execute(),
    dbKysely
      .insertInto("feed_monitor_daily_summary")
      .values([
        {
          id: "1",
          date_of_journey: new Date("2025-10-17T00:00:00Z"),
          operator_noc: "OP1",
          update_frequency: 15,
          availability: "0.1",
        },
        {
          id: "2",
          date_of_journey: new Date("2025-10-18T00:00:00Z"),
          operator_noc: "OP2",
          update_frequency: 10,
          availability: "0.2",
        },
        {
          id: "3",
          date_of_journey: new Date("2025-10-19T00:00:00Z"),
          operator_noc: "OP3",
          update_frequency: 20,
          availability: "0.3",
        },
      ])
      .execute(),
    dbKysely
      .insertInto("feed_monitor_hourly_summary")
      .values([
        {
          id: "1",
          operator_noc: "OP1",
          received_interval: new Date("2025-10-17T08:00:00Z"),
          expected: 12,
          actual: 12,
        },
        {
          id: "2",
          operator_noc: "OP2",
          received_interval: new Date("2025-10-17T09:00:00Z"),
          expected: 10,
          actual: 9,
        },
        {
          id: "3",
          operator_noc: "OP3",
          received_interval: new Date("2025-10-17T10:00:00Z"),
          expected: 15,
          actual: 15,
        },
      ])
      .execute(),
    dbKysely
      .insertInto("feed_monitor_minute_summary")
      .values([
        {
          id: "1",
          date_of_journey: new Date(),
          operator_noc: "OP1",
          received_interval: new Date(),
          expected: 2,
          actual: 2,
          live_locations: 2,
        },
        {
          id: "2",
          date_of_journey: new Date(),
          operator_noc: "OP2",
          received_interval: new Date(),
          expected: 3,
          actual: 2,
          live_locations: 2,
        },
        {
          id: "3",
          date_of_journey: new Date(),
          operator_noc: "OP3",
          received_interval: new Date(),
          expected: 1,
          actual: 1,
          live_locations: 1,
        },
      ])
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
