import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class SessionService {
  readonly STORE_SESSION_KEY = "session";

  isSessionAlive(): boolean {
    const storage = this.getSession();
    if (!storage) {
      return false;
    }
    const session = JSON.parse(storage);
    const now = new Date().getTime();
    if (now > new Date(session.expiresAt).getTime()) {
      console.error(session.expiresAt);
      console.error(now);
      return false;
    }
    return true;
  }

  setSession(session: string) {
    localStorage.setItem(this.STORE_SESSION_KEY, session);
  }

  getSession() {
    return localStorage.getItem(this.STORE_SESSION_KEY);
  }

  clearSession() {
    localStorage.removeItem(this.STORE_SESSION_KEY);
  }
}
