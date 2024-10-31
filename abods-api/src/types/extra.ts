import { Context } from "../context.js";
import express from "express";
import { IncomingHttpHeaders } from "http";

export type AuthContext = {
  allowedTokenHash: string;
  Hmac: string;
};

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  db: Context;
  apiKeyAuth?: AuthContext;
}

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  orgIds: number[];
}
