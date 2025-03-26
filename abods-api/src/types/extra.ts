import express from "express";
import { IncomingHttpHeaders } from "http";
import { Kysely } from "kysely";
import { DB } from "../kysely.js";
import { BaseContext } from "@apollo/server";

export interface AuthContext {
  allowedTokenHash: string;
  Hmac: string;
}

export interface RequestContext extends BaseContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  apiKeyAuth?: AuthContext;
  kysely: Kysely<DB>;
}

export interface SessionUser {
  id: number;
  orgIds: number[];
}
