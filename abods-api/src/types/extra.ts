import express from "express";
import { IncomingHttpHeaders } from "http";
import { PrismaClient } from "@prisma/client";
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
