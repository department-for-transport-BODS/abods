import { TestBed } from "@angular/core/testing";

import { SessionService } from "./session.service";

describe("SessionService", () => {
  let service: SessionService;

  beforeEach(() => {
    service = TestBed.inject(SessionService);
    service.clearSession();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("isSessionAlive", () => {
    it("should return false if there is no session in local storage", () => {
      expect(service.isSessionAlive()).toBeFalse();
    });

    it("should return false if current timestamp is greater than session expiry timestamp", () => {
      const session = '{"expiresAt":"2022-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive()).toBeFalse();
    });

    it("should return true if current timestamp is less than session expiry timestamp", () => {
      const session = '{"expiresAt":"2122-08-01T12:48:48.672212+00:00"}';
      service.setSession(session);

      expect(service.isSessionAlive()).toBeTrue();
    });
  });
});
