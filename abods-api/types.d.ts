
import { Session } from 'express-session';
import { Request } from 'express';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
    }
  }
}

declare module 'express' { 
  export interface Request {
    user?: {
      id: string
    }
  }
}
