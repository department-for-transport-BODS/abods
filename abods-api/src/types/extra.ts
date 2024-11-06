import express from "express";
import { IncomingHttpHeaders } from "http";
import { PrismaClient } from '@prisma/client';

export type AuthContext = {
  allowedTokenHash: string;
  Hmac: string;
};

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  db: PrismaClient;
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

export type AVLType = {
  group_id: string | null;
  recorded_at_time: Date;
  vehicle_ref: string;
}