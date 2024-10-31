import { Context } from '../context.js';
import express from 'express';
import { IncomingHttpHeaders } from 'http';
export interface RequestContext {
  req: express.Request;
  res: express.Response;
  headers: IncomingHttpHeaders;
  db: Context;
}

export interface SessionUser {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  orgIds: number[];
}
