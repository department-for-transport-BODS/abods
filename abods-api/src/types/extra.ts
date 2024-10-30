import { Context } from '../context';
import { bods_user } from '@prisma/client';
import express from 'express';

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  sessionUser: SessionUser | null;
  db: Context;
}

export interface SessionUser extends bods_user {
  orgIds: number[];
}
