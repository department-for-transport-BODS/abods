import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { ConfigService } from "../../config/config.service";

import { OtpThresholdDefaultsService } from "./otp-threshold-defaults.service";

describe("OtpThresholdFormService", () => {
  let service: OtpThresholdDefaultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [ConfigService, provideHttpClient(withInterceptorsFromDi())],
    });
    service = TestBed.inject(OtpThresholdDefaultsService);
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  it("should return deafults from config service", async () => {
    await expect(service.early).toEqual(1);
    await expect(service.late).toEqual(6);
  });

  it("should reset all to false", async () => {
    service.early = 10;
    service.late = 20;

    await expect(service.early).toEqual(10);
    await expect(service.late).toEqual(20);

    service.resetAll();

    await expect(service.early).toEqual(1);
    await expect(service.late).toEqual(6);
  });
});
