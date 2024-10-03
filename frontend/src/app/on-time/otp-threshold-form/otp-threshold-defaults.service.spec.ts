import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../../config/config.service';

import { OtpThresholdDefaultsService } from './otp-threshold-defaults.service';

describe('OtpThresholdFormService', () => {
  let service: OtpThresholdDefaultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigService],
      imports: [HttpClientModule],
    });
    service = TestBed.inject(OtpThresholdDefaultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return deafults from config service', () => {
    expect(service.early).toEqual(1);
    expect(service.late).toEqual(6);
  });

  it('should reset all to false', () => {
    service.early = 10;
    service.late = 20;

    expect(service.early).toEqual(10);
    expect(service.late).toEqual(20);

    service.resetAll();

    expect(service.early).toEqual(1);
    expect(service.late).toEqual(6);
  });
});
