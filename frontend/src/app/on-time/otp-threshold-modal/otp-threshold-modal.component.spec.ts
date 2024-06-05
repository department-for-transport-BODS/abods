import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, byText, SpyObject } from '@ngneat/spectator';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { DateTime, Settings } from 'luxon';
import { NgxSmartModalModule, NgxSmartModalService } from 'ngx-smart-modal';
import { of, throwError } from 'rxjs';
import { ConfigService } from '../../config/config.service';
import { SharedModule } from '../../shared/shared.module';
import { OnTimeService, PerformanceParams } from '../on-time.service';
import { OtpThresholdFormComponent } from '../otp-threshold-form/otp-threshold-form.component';
import {
  OtpThresholdModalComponent,
  OtpThresholdModalData,
  OTP_THRESHOLD_MODAL_ID,
} from './otp-threshold-modal.component';

describe('OtpThresholdModalComponent', () => {
  let spectator: Spectator<OtpThresholdModalComponent>;
  let component: OtpThresholdModalComponent;
  let ngxSmartModalService: NgxSmartModalService;
  let onTimeService: SpyObject<OnTimeService>;

  const modalData = <OtpThresholdModalData>{
    params: {
      fromTimestamp: DateTime.now().toISO().toString() as string,
      toTimestamp: DateTime.now().plus({ days: 1 }).toISO().toString() as string,
      filters: {},
    },
    defaultValues: {
      early: 10,
      late: 20,
      onTime: 70,
      completed: 100,
    },
  };

  const createComponent = createComponentFactory({
    component: OtpThresholdModalComponent,
    declarations: [OtpThresholdFormComponent],
    mocks: [OnTimeService, SvgIconRegistryService, HttpClient],
    providers: [ConfigService],
    imports: [NgxSmartModalModule, SharedModule, ReactiveFormsModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    ngxSmartModalService = spectator.inject(NgxSmartModalService);
    onTimeService = spectator.inject(OnTimeService);
    Settings.now = () => 1630494000000; // 2021-09-01T12:00:00
    ngxSmartModalService.setModalData(modalData, OTP_THRESHOLD_MODAL_ID, true);
    ngxSmartModalService.open(OTP_THRESHOLD_MODAL_ID);
    spectator.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show default percentages on modal opening', () => {
    expect(component.tableData.onTime.defaultValue).toEqual(0.7);
    expect(component.tableData.early.defaultValue).toEqual(0.1);
    expect(component.tableData.late.defaultValue).toEqual(0.2);
    expect(spectator.query(byText('70%'))).toBeVisible();
    expect(spectator.query(byText('20%'))).toBeVisible();
    expect(spectator.query(byText('10%'))).toBeVisible();
  });

  it('should call fetchOnTimeStats on compare with default values', () => {
    spectator.click(byText('Compare'));

    const expected: PerformanceParams = {
      fromTimestamp: modalData.params?.fromTimestamp,
      toTimestamp: modalData.params?.toTimestamp,
      filters: { ...modalData.params?.filters, onTimeMaxMinutes: 6, onTimeMinMinutes: -1 },
    };

    expect(onTimeService.fetchOnTimeStats).toHaveBeenCalledWith(expected);
  });

  it('should display comparison values', () => {
    onTimeService.fetchOnTimeStats.and.returnValue(of({ early: 35, late: 5, onTime: 60, completed: 100 }));
    spectator.click(byText('Compare'));
    spectator.detectChanges();

    expect(component.tableData.onTime.comparisonValue).toEqual(0.6);
    expect(component.tableData.early.comparisonValue).toEqual(0.35);
    expect(component.tableData.late.comparisonValue).toEqual(0.05);
    expect(spectator.query(byText('60%'))).toBeVisible();
    expect(spectator.query(byText('35%'))).toBeVisible();
    expect(spectator.query(byText('5%'))).toBeVisible();
  });

  it('should show error message on error', () => {
    onTimeService.fetchOnTimeStats.and.returnValue(throwError(() => 'error'));
    spectator.click(byText('Compare'));
    spectator.detectChanges();

    expect(spectator.query(byText('There was an issue comparing data, please try again.'))).toBeVisible();
  });
});
