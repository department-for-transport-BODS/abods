import express from "express";
import { IncomingHttpHeaders } from "http";
import { PrismaClient } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../kysely.js";

export interface AuthContext {
  allowedTokenHash: string;
  Hmac: string;
}

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  db: PrismaClient;
  apiKeyAuth?: AuthContext;
  kysely: Kysely<DB>;
}

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  orgId: number;
}

export enum RouteType {
  valid = "VALID",
  invalid_no_route_points = "INVALID_NO_ROUTE_POINTS",
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: number[][];
}
