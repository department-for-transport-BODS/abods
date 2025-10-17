import { Kysely, sql, SelectQueryBuilder, UpdateQueryBuilder } from "kysely";
import { DB } from "../kysely";
import { SimplifySingleResult } from "kysely/dist/cjs/util/type-utils";

export const executeQuery = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T[]> => {
  return query.execute();
};

export const executeQueryTakeFirst = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T | undefined> => {
  return query.executeTakeFirst();
};

export const updateQueryTakeFirst = async <T>(
  query: UpdateQueryBuilder<DB, never, never, T>,
): Promise<SimplifySingleResult<T> | undefined> => {
  return query.executeTakeFirst();
};

// Helper functions for integration tests to create tables
// Example: pass your Kysely<DB> instance as `db` to these functions
// These are minimal definitions; adjust types and SQL as needed for your schema
// For views, you must provide the correct SQL for your view definition

export async function createAvlLineLevelMonitoringTable(db: Kysely<DB>) {
  await db.schema
    .createTable("avl_line_level_monitoring")
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("last_recorded_at_time", "timestamptz", (col) => col.notNull())
    .execute();
}

export async function createLoginDetailsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("login_details")
    .addColumn("user_id", "integer", (col) => col.primaryKey())
    .addColumn("last_login", "timestamptz", (col) => col.notNull())
    .addColumn("data_monitoring_access_count", "integer")
    .addColumn("data_monitoring_access_refresh", "timestamptz")
    .execute();
}

export async function createNaptanAdminareaTable(db: Kysely<DB>) {
  await db.schema
    .createTable("naptan_adminarea")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("traveline_region_id", "varchar", (col) => col.notNull())
    .addColumn("atco_code", "varchar", (col) => col.notNull())
    .addColumn("ui_lta_id", "integer")
    .execute();
}

export async function createNaptanAdminareaWithShapeTable(db: Kysely<DB>) {
  await db.schema
    .createTable("naptan_adminarea_with_shape")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("atco_code", "varchar")
    .addColumn("st_asgeojson", "varchar", (col) => col.notNull())
    .execute();
}

export async function createNaptanLocalityTable(db: Kysely<DB>) {
  await db.schema
    .createTable("naptan_locality")
    .addColumn("gazetteer_id", "varchar", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("easting", "integer", (col) => col.notNull())
    .addColumn("northing", "integer", (col) => col.notNull())
    .addColumn("admin_area_id", "varchar", (col) => col.notNull())
    .addColumn("district_id", "integer")
    .execute();
}

export async function createNaptanStoppointLatlongTable(db: Kysely<DB>) {
  await db.schema
    .createTable("naptan_stoppoint_latlong")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("atco_code", "varchar")
    .addColumn("naptan_code", "varchar")
    .addColumn("common_name", "varchar", (col) => col.notNull())
    .addColumn("street", "varchar")
    .addColumn("indicator", "varchar")
    .addColumn("admin_area_id", "integer", (col) => col.notNull())
    .addColumn("locality_id", "varchar", (col) => col.notNull())
    .addColumn("stop_areas", sql`varchar[]`, (col) => col.notNull())
    .addColumn("bus_stop_type", "varchar")
    .addColumn("stop_type", "varchar")
    .addColumn("longitude", "double precision")
    .addColumn("latitude", "double precision")
    .execute();
}

export async function createNocAdminareaTable(db: Kysely<DB>) {
  await db.schema
    .createTable("noc_adminarea")
    .addColumn("national_operator_code", "varchar", (col) => col.notNull())
    .addColumn("adminarea_id", "integer", (col) => col.notNull())
    .execute();
}

export async function createServicepatternRouteTable(db: Kysely<DB>) {
  await db.schema
    .createTable("servicepattern_route")
    .addColumn("distinct_route_id", "integer", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .execute();
}

export async function createSiriVMPositionsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("SiriVMPositions")
    .addColumn("siri_vm_positions_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_ref", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("journey_ref", "varchar", (col) => col.notNull())
    .addColumn("direction_ref", "varchar")
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("latitude", "double precision")
    .addColumn("longitude", "double precision")
    .addColumn("vehicle_ref", "varchar", (col) => col.notNull())
    .addColumn("batch_id", "varchar")
    .addColumn("recorded_at_time", "timestamptz", (col) => col.notNull())
    .addColumn("response_time_stamp", "timestamptz")
    .addColumn("load_time_stamp", "timestamptz")
    .addColumn("group_id", "varchar")
    .addColumn("origin_ref", "varchar")
    .addColumn("destination_ref", "varchar")
    .addColumn("departure_time", "timestamptz")
    .execute();
}

export async function createTimetableTable(db: Kysely<DB>) {
  await db.schema
    .createTable("Timetable")
    .addColumn("timetable_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("operator_name", "varchar", (col) => col.notNull())
    .addColumn("service_code", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar")
    .addColumn("xml_file_name", "varchar")
    .addColumn("journey_code", "varchar")
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("day_of_week", "integer")
    .addColumn("common_name", "varchar")
    .addColumn("atco_code", "varchar")
    .addColumn("stop_type", "varchar")
    .addColumn("stop_index", "integer", (col) => col.notNull())
    .addColumn("stop_latitude", "double precision")
    .addColumn("stop_longitude", "double precision")
    .addColumn("locality_id", "varchar")
    .addColumn("expected_departure_time", "timestamptz")
    .addColumn("actual_departure_time", "timestamptz")
    .addColumn("is_timing_point", "boolean")
    .addColumn("group_id", "varchar")
    .addColumn("previous_group_id", "varchar")
    .addColumn("otp_state", "varchar")
    .addColumn("expected_headway", "integer")
    .addColumn("actual_headway", "integer")
    .addColumn("headway_time_difference", "integer")
    .addColumn("time_difference", "integer")
    .addColumn("stop_id", "integer", (col) => col.notNull())
    .addColumn("load_time_stamp", "timestamptz")
    .addColumn("off_set", "integer")
    .addColumn("servicepattern_id", "integer")
    .addColumn("vehiclejourney_id", "integer")
    .addColumn("admin_area_id", "integer")
    .addColumn("timestamp_after_estimate", "timestamptz")
    .addColumn("direction", "varchar")
    .addColumn("departure_day_shift", "boolean")
    .addColumn("siri_vm_position_id", "varchar")
    .addColumn("incomplete_reason", "integer")
    .addColumn("set_down", "boolean")
    .execute();
}

export async function createTimetableFrequentSummaryServicesTable(
  db: Kysely<DB>,
) {
  await db.schema
    .createTable("timetable_frequent_summary_services")
    .addColumn("timetable_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("service_code", "varchar", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour_only", "timestamptz", (col) => col.notNull())
    .addColumn("day_of_week", "integer", (col) => col.notNull())
    .addColumn("max_early", "integer", (col) => col.notNull())
    .addColumn("max_late", "integer", (col) => col.notNull())
    .addColumn("avg_time_difference", "varchar", (col) => col.notNull())
    .addColumn("expected_headway", "varchar")
    .addColumn("actual_headway", "varchar")
    .addColumn("excess_wait_time", "varchar")
    .addColumn("headway_stops_count", "varchar", (col) => col.notNull())
    .addColumn("estimated", "boolean", (col) => col.notNull())
    .addColumn("is_timing_point", "boolean")
    .execute();
}

export async function createTimetableSummaryOperatorTTable(db: Kysely<DB>) {
  await db.schema
    .createTable("timetable_summary_operator_t")
    .addColumn("timetable_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour_only", "timestamptz", (col) => col.notNull())
    .addColumn("day_of_week", "integer", (col) => col.notNull())
    .addColumn("on_time_count", "integer")
    .addColumn("early_count", "integer")
    .addColumn("late_count", "integer")
    .addColumn("completed", "integer")
    .addColumn("scheduled", "integer")
    .addColumn("is_timing_point", "boolean", (col) => col.notNull())
    .addColumn("max_early", "integer", (col) => col.notNull())
    .addColumn("max_late", "integer", (col) => col.notNull())
    .addColumn("avg_time_difference", "varchar", (col) => col.notNull())
    .addColumn("admin_areas", sql`integer[]`, (col) => col.notNull())
    .addColumn("estimated", "boolean")
    .addColumn("incomplete_reason", "integer")
    .addColumn("count_delayed", "integer", (col) => col.notNull())
    .addColumn("average_delay", "integer", (col) => col.notNull())
    .execute();
}

export async function createTimetableSummaryServiceTzTable(db: Kysely<DB>) {
  await db.schema
    .createTable("timetable_summary_service_tz")
    .addColumn("timetable_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour_only", "timestamptz", (col) => col.notNull())
    .addColumn("day_of_week", "integer", (col) => col.notNull())
    .addColumn("on_time_count", "integer")
    .addColumn("early_count", "integer")
    .addColumn("late_count", "integer")
    .addColumn("completed", "integer")
    .addColumn("scheduled", "integer")
    .addColumn("is_timing_point", "boolean", (col) => col.notNull())
    .addColumn("max_early", "integer", (col) => col.notNull())
    .addColumn("max_late", "integer", (col) => col.notNull())
    .addColumn("avg_time_difference", "varchar")
    .addColumn("admin_areas", sql`integer[]`, (col) => col.notNull())
    .addColumn("estimated", "boolean", (col) => col.notNull())
    .addColumn("incomplete_reason", "integer")
    .addColumn("direction", "varchar", (col) => col.notNull())
    .addColumn("count_delayed", "integer", (col) => col.notNull())
    .addColumn("average_delay", "integer", (col) => col.notNull())
    .execute();
}

export async function createTimetableSummaryStopsTzTable(db: Kysely<DB>) {
  await db.schema
    .createTable("timetable_summary_stops_tz")
    .addColumn("timetable_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("service_code", "varchar", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("stop_id", "integer", (col) => col.notNull())
    .addColumn("locality_id", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("stop_latitude", "double precision", (col) => col.notNull())
    .addColumn("stop_longitude", "double precision", (col) => col.notNull())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour", "timestamptz", (col) => col.notNull())
    .addColumn("departure_hour_only", "timestamptz", (col) => col.notNull())
    .addColumn("day_of_week", "integer", (col) => col.notNull())
    .addColumn("on_time_count", "integer")
    .addColumn("early_count", "integer")
    .addColumn("late_count", "integer")
    .addColumn("completed", "integer")
    .addColumn("scheduled", "integer")
    .addColumn("common_name", "varchar", (col) => col.notNull())
    .addColumn("is_timing_point", "boolean", (col) => col.notNull())
    .addColumn("max_early", "integer", (col) => col.notNull())
    .addColumn("max_late", "integer", (col) => col.notNull())
    .addColumn("avg_time_difference", "varchar")
    .addColumn("estimated", "boolean", (col) => col.notNull())
    .addColumn("incomplete_reason", "integer")
    .addColumn("direction", "varchar", (col) => col.notNull())
    .addColumn("stop_index", "integer", (col) => col.notNull())
    .addColumn("count_delayed", "integer", (col) => col.notNull())
    .addColumn("average_delay", "integer", (col) => col.notNull())
    .addColumn("diff_sched_time_to_stop", "integer", (col) => col.notNull())
    .addColumn("diff_sched_time_to_stop_timing_point", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("diff_actual_time_to_stop", "integer", (col) => col.notNull())
    .addColumn("diff_actual_time_to_stop_timing_point", "integer", (col) =>
      col.notNull(),
    )
    .execute();
}

export async function createTimetableThresholdSummaryTable(db: Kysely<DB>) {
  await db.schema
    .createTable("timetable_threshold_summary")
    .addColumn("threshold_id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar")
    .addColumn("line_name", "varchar")
    .addColumn("noc_and_line_and_servicecode", "varchar")
    .addColumn("service_name", "varchar")
    .addColumn("date_of_journey", "timestamptz")
    .addColumn("is_timing_point", "boolean")
    .addColumn("time_diff_minutes", "integer")
    .addColumn("departure_hour", "timestamptz")
    .addColumn("admin_areas", sql`integer[]`, (col) => col.notNull())
    .addColumn("otp_count", "integer")
    .addColumn("day_of_week", "integer")
    .addColumn("estimated", "boolean")
    .addColumn("departure_hour_only", "timestamptz")
    .execute();
}

export async function createTransmodelServicepatterndistanceTable(
  db: Kysely<DB>,
) {
  await db.schema
    .createTable("transmodel_servicepatterndistance")
    .addColumn("service_pattern_id", "integer", (col) => col.notNull())
    .addColumn("distance", "integer")
    .addColumn("geom", "varchar")
    .execute();
}

export async function createTransmodelServicepatternstopTable(db: Kysely<DB>) {
  await db.schema
    .createTable("transmodel_servicepatternstop")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("sequence_number", "integer", (col) => col.notNull())
    .addColumn("atco_code", "varchar", (col) => col.notNull())
    .addColumn("naptan_stop_id", "integer", (col) => col.notNull())
    .addColumn("service_pattern_id", "integer", (col) => col.notNull())
    .addColumn("departure_time", "timestamptz")
    .addColumn("is_timing_point", "boolean", (col) => col.notNull())
    .addColumn("txc_common_name", "varchar")
    .addColumn("vehicle_journey_id", "integer")
    .addColumn("stop_activity_id", "integer")
    .execute();
}

export async function createTransmodelTracksTable(db: Kysely<DB>) {
  await db.schema
    .createTable("transmodel_tracks")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("from_atco_code", "varchar", (col) => col.notNull())
    .addColumn("to_atco_code", "varchar", (col) => col.notNull())
    .addColumn("geometry", "varchar")
    .addColumn("distance", "integer")
    .execute();
}

export async function createTransmodelVehiclejourneyTable(db: Kysely<DB>) {
  await db.schema
    .createTable("transmodel_vehiclejourney")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("start_time", "timestamptz")
    .addColumn("direction", "varchar")
    .addColumn("journey_code", "varchar")
    .addColumn("line_ref", "varchar")
    .addColumn("departure_day_shift", "boolean", (col) => col.notNull())
    .addColumn("service_pattern_id", "integer")
    .addColumn("block_number", "varchar")
    .addColumn("vehicle_journey_id", "integer")
    .execute();
}

export async function createUiLtaTable(db: Kysely<DB>) {
  await db.schema
    .createTable("ui_lta")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .execute();
}
export async function createFeedMonitorDailySummaryTable(db: Kysely<DB>) {
  await db.schema
    .createTable("feed_monitor_daily_summary")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("update_frequency", "integer")
    .addColumn("availability", "varchar")
    .execute();
}

export async function createFeedMonitorHourlySummaryTable(db: Kysely<DB>) {
  await db.schema
    .createTable("feed_monitor_hourly_summary")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("received_interval", "timestamptz", (col) => col.notNull())
    .addColumn("expected", "integer", (col) => col.notNull())
    .addColumn("actual", "integer", (col) => col.notNull())
    .execute();
}

export async function createFeedMonitorMinuteSummaryTable(db: Kysely<DB>) {
  await db.schema
    .createTable("feed_monitor_minute_summary")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("received_interval", "timestamptz", (col) => col.notNull())
    .addColumn("expected", "integer", (col) => col.notNull())
    .addColumn("actual", "integer", (col) => col.notNull())
    .addColumn("live_locations", "integer", (col) => col.notNull())
    .execute();
}

export async function createFeedMonitorSummaryTable(db: Kysely<DB>) {
  await db.schema
    .createTable("feed_monitor_summary")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("last_outage", "timestamptz")
    .addColumn("unavailable_since", "timestamptz")
    .addColumn("update_frequency", "integer")
    .addColumn("availability", "varchar")
    .execute();
}

export async function createExpectedJourneysTable(db: Kysely<DB>) {
  await db.schema
    .createTable("expected_journeys")
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("operator_noc", "varchar")
    .addColumn("line_name", "varchar")
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("journey_code", "varchar", (col) => col.notNull())
    .addColumn("group_id", "varchar", (col) => col.notNull())
    .addColumn("stop_count", "integer")
    .addColumn("expected_journey_start", "timestamptz")
    .addColumn("journey_pattern_description", "varchar", (col) => col.notNull())
    .addColumn("vehicle_journey_id", "integer")
    .addColumn("day_of_week", "integer")
    .addColumn("admin_area_id", sql`integer[]`, (col) => col.notNull())
    .addColumn("expected_journey_end", "timestamptz")
    .addColumn("direction", "varchar")
    .addColumn("is_cancelled", "boolean", (col) => col.notNull())
    .execute();
}

export async function createExpectedOperatorsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("expected_operators")
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("operator_name", "varchar")
    .execute();
}

export async function createExpectedServicesTable(db: Kysely<DB>) {
  await db.schema
    .createTable("expected_services")
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("service_name", "varchar", (col) => col.notNull())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("admin_area_id", sql`integer[]`, (col) => col.notNull())
    .addColumn("total_distance", "integer", (col) => col.notNull())
    .addColumn("avl_true_distance", "integer", (col) => col.notNull())
    .addColumn("license", "varchar")
    .execute();
}
export async function createPerformanceStatisticsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("performance_statistics")
    .addColumn("operator_noc", "varchar", (col) => col.notNull())
    .addColumn("line_name", "varchar", (col) => col.notNull())
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.notNull(),
    )
    .addColumn("service_name", "varchar")
    .addColumn("is_timing_point", "boolean")
    .addColumn("date_period_start", "timestamptz", (col) => col.notNull())
    .addColumn("date_period_end", "timestamptz")
    .addColumn("period_type", "varchar", (col) => col.notNull())
    .addColumn("on_time_count", "integer")
    .addColumn("early_count", "integer")
    .addColumn("late_count", "integer")
    .addColumn("total_count", "integer")
    .addColumn("on_time_percentage", "varchar")
    .addColumn("trend_period_start", "timestamptz")
    .addColumn("trend_period_end", "timestamptz")
    .addColumn("trend_on_time_count", "integer")
    .addColumn("trend_early_count", "integer")
    .addColumn("trend_late_count", "integer")
    .addColumn("trend_total_count", "integer")
    .addColumn("trend_percentage", "varchar")
    .addColumn("percentage_change", "varchar")
    .execute();
}
export async function createRouteToJourneysTable(db: Kysely<DB>) {
  await db.schema
    .createTable("route_to_journeys")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("group_id", "varchar", (col) => col.notNull())
    .addColumn("date_of_journey", "timestamptz", (col) => col.notNull())
    .addColumn("distinct_route_id", "integer", (col) => col.notNull())
    .execute();
}
export async function createServiceDetailsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("service_details")
    .addColumn("noc_and_line_and_servicecode", "varchar", (col) =>
      col.primaryKey(),
    )
    .addColumn("operator_noc", "varchar")
    .addColumn("line_name", "varchar")
    .addColumn("service_name", "varchar")
    .addColumn("admin_areas", sql`integer[]`, (col) => col.notNull())
    .addColumn("license", "varchar", (col) => col.notNull())
    .execute();
}

export async function createFeatureFlagTable(db: Kysely<DB>) {
  await db.schema
    .createTable("FeatureFlag")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("consolidate_histogram", "boolean", (col) => col.notNull())
    .addColumn("corridor_stats_timezone_enabled", "boolean", (col) =>
      col.notNull(),
    )
    .addColumn("freshdesk_enabled", "boolean", (col) => col.notNull())
    .addColumn("line_direction_filtering", "boolean", (col) => col.notNull())
    .addColumn("sso_enabled", "boolean", (col) => col.notNull())
    .addColumn("stop_index_filtering", "boolean", (col) => col.notNull())
    .addColumn("tagging_include_bank_holidays", "boolean", (col) =>
      col.notNull(),
    )
    .addColumn("vehicle_replay_from_timestream", "boolean", (col) =>
      col.notNull(),
    )
    .addColumn("journey_insights_enabled", "boolean", (col) => col.notNull())
    .execute();
}
export async function createCorridorTable(db: Kysely<DB>) {
  await db.schema
    .createTable("corridor")
    .addColumn("corridor_id", "serial", (col) => col.primaryKey())
    .addColumn("corridor_name", "varchar", (col) => col.notNull())
    .addColumn("organisation_id", "integer", (col) => col.notNull())
    .addColumn("user_id", "integer", (col) => col.notNull())
    .execute();
}

export async function createCorridorStopsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("corridor_stops")
    .addColumn("corridor_index", "integer", (col) => col.notNull())
    .addColumn("corridor_id", "integer", (col) => col.notNull())
    .addColumn("stop_id", "integer", (col) => col.notNull())
    .execute();
}

export async function createDistinctRoutesTable(db: Kysely<DB>) {
  await db.schema
    .createTable("distinct_routes")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("route", "varchar", (col) => col.notNull())
    .execute();
}

export async function createTokensTable(db: Kysely<DB>) {
  await db.schema
    .createTable("Tokens")
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("token", "varchar")
    .addColumn("expires", "timestamptz")
    .addPrimaryKeyConstraint("tokens_pkey", ["user_id"])
    .execute();
}

export async function createAlertTable(db: Kysely<DB>) {
  await db.schema
    .createTable("Alert")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("alert_id", "varchar")
    .addColumn("alert", "varchar")
    .addColumn("event_hysterisis", "varchar")
    .addColumn("event_threshold", "varchar")
    .addColumn("send_to", "integer")
    .addColumn("created_by", "integer")
    .execute();
}

export async function createAllOperatorsTable(db: Kysely<DB>) {
  await db.schema
    .createTable("all_operators")
    .addColumn("operatorid", "integer")
    .addColumn("operatorref", "varchar", (col) => col.notNull())
    .addColumn("name", "varchar")
    .execute();
}

export async function createApiInfoTable(db: Kysely<DB>) {
  await db.schema
    .createTable("ApiInfo")
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("version", "varchar", (col) => col.notNull())
    .addColumn("build_number", "varchar", (col) => col.notNull())
    .addColumn("timezone", "varchar", (col) => col.notNull())
    .addColumn("feature_flag_id", "varchar", (col) => col.notNull())
    .execute();
}

export async function createBodsOrganisationTable(db: Kysely<DB>) {
  await db.schema
    .createTable("bods_organisation")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("name", "varchar")
    .addColumn("is_abods_global_viewer", "boolean")
    .execute();
}

export async function createBodsOrganisationOrganisationAdminAreasTable(
  db: Kysely<DB>,
) {
  await db.schema
    .createTable("bods_organisation_organisation_admin_areas")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("organisation_id", "integer")
    .addColumn("adminarea_id", "integer")
    .execute();
}

export async function createBodsOrganisationOperatorTable(db: Kysely<DB>) {
  await db.schema
    .createTable("bods_organisationoperator")
    .addColumn("organisation_id", "integer")
    .addColumn("operatorref", "varchar", (col) => col.notNull())
    .execute();
}

export async function createBodsUserTable(db: Kysely<DB>) {
  await db.schema
    .createTable("bods_user")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("username", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull())
    .addColumn("first_name", "varchar")
    .addColumn("last_name", "varchar")
    .addColumn("password", "varchar", (col) => col.notNull())
    .addColumn("is_superuser", "boolean")
    .addColumn("is_active", "boolean")
    .addColumn("account_type", "integer")
    .addColumn("admin_org", "integer")
    .execute();
}

export async function createBodsUserOrganisationTable(db: Kysely<DB>) {
  await db.schema
    .createTable("bods_userorganisation")
    .addColumn("user_id", "integer")
    .addColumn("organisation_id", "integer")
    .execute();
}
