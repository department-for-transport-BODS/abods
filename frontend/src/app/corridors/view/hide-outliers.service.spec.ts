import { TestBed } from '@angular/core/testing';

import { HideOutliersService } from './hide-outliers.service';

describe('HideOutliersService', () => {
  let service: HideOutliersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HideOutliersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set all outliers to false on init', () => {
    expect(service.hideOutliersDayOfWeek).toBeFalse();
    expect(service.hideOutliersTimeOfDay).toBeFalse();
    expect(service.hideOutliersDayOfWeek).toBeFalse();
  });

  it('should reset all to false', () => {
    service.hideOutliersDayOfWeek = true;
    service.hideOutliersTimeOfDay = true;
    service.hideOutliersDayOfWeek = true;

    expect(service.hideOutliersDayOfWeek).toBeTrue();
    expect(service.hideOutliersTimeOfDay).toBeTrue();
    expect(service.hideOutliersDayOfWeek).toBeTrue();

    service.resetAll();

    expect(service.hideOutliersDayOfWeek).toBeFalse();
    expect(service.hideOutliersTimeOfDay).toBeFalse();
    expect(service.hideOutliersDayOfWeek).toBeFalse();
  });
});
