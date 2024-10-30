import { Context } from '../context';
import express from 'express';

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  headers: any;
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
