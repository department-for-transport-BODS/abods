import express from "express";
import { IncomingHttpHeaders } from "http";
import { PrismaClient, Timetable } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../kysely.js";
import { BaseContext } from "@apollo/server";
import { CorridorStatsInputType } from "./generated.js";

export interface AuthContext {
  allowedTokenHash: string;
  Hmac: string;
}

export interface RequestContext extends BaseContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  db: PrismaClient;
  apiKeyAuth?: AuthContext;
  kysely: Kysely<DB>;
}

export interface SessionUser {
  id: number;
  orgs: {
    id: number;
    name: string;
  }[];
  isGlobalUser?: boolean;
}

export type OTPSummaryTables = keyof Pick<
  DB,
  | "timetable_summary_service_tz"
  | "timetable_summary_operator_t"
  | "timetable_summary_stops_tz"
  | "timetable_frequent_summary_services"
  | "timetable_threshold_summary"
>;

export interface StatsCache {
  inputs: CorridorStatsInputType;
  corridorTransits: TimetableType[][];
}

export type TimetableType = Pick<
  Timetable,
  | "atco_code"
  | "stop_index"
  | "actual_departure_time"
  | "timestamp_after_estimate"
  | "expected_departure_time"
  | "operator_noc"
  | "service_code"
  | "line_name"
  | "date_of_journey"
  | "vehiclejourney_id"
  | "group_id"
>;
