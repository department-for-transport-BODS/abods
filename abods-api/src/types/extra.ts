import { Context } from '../context';
import { bods_user } from '@prisma/client';
import express from 'express';

export interface RequestContext {
  req: express.Request;
  res: express.Response;
  sessionUser: SessionUser;
  db: Context;
}

export interface SessionUser {
  user: bods_user | null;
  userOrganisationIDs: number[] | null;
}
