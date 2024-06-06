import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NgxSmartModalComponent, NgxSmartModalService } from 'ngx-smart-modal';
import { Subject, takeUntil } from 'rxjs';
import { FormErrors } from '../../shared/gds/error-summary/error-summary.component';
import { OnTimeService, PerformanceParams, PunctualityOverview } from '../on-time.service';
import { OtpThresholdParams } from '../otp-threshold-form/otp-threshold-form.component';

export const OTP_THRESHOLD_MODAL_ID = 'otp-threshold-modal';

export interface OtpThresholdModalData {
  params: PerformanceParams | null;
  defaultValues?: PunctualityOverview;
}

interface OtpThresholdComparisonData {
  name: string;
  defaultValue: number | null;
  comparisonValue: number | null;
}

interface OtpThresholdTableData {
  onTime: OtpThresholdComparisonData;
  late: OtpThresholdComparisonData;
  early: OtpThresholdComparisonData;
}

@Component({
  selector: 'app-otp-threshold-modal',
  templateUrl: './otp-threshold-modal.component.html',
  styleUrls: ['./otp-threshold-modal.component.scss'],
})
export class OtpThresholdModalComponent implements AfterViewInit, OnDestroy {
  identifier = OTP_THRESHOLD_MODAL_ID;
  tableData: OtpThresholdTableData = {
    onTime: { name: 'On time', defaultValue: null, comparisonValue: null },
    late: { name: 'Late', defaultValue: null, comparisonValue: null },
    early: { name: 'Early', defaultValue: null, comparisonValue: null },
  };
  orderBy = () => 0;
  params!: PerformanceParams;

  loading = false;
  errors: FormErrors[] = [];

  constructor(private modalService: NgxSmartModalService, private onTimeService: OnTimeService) {}

  private destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    const modal = this.modalService.getModal(OTP_THRESHOLD_MODAL_ID);

    modal.onOpen.pipe(takeUntil(this.destroy$)).subscribe((modal: NgxSmartModalComponent) => {
      const data = modal.getData() as OtpThresholdModalData;
      const completed = data.defaultValues?.completed;

      this.tableData.onTime.defaultValue = this.setOtpValue(data.defaultValues?.onTime, completed);
      this.tableData.early.defaultValue = this.setOtpValue(data.defaultValues?.early, completed);
      this.tableData.late.defaultValue = this.setOtpValue(data.defaultValues?.late, completed);
      this.params = data.params as PerformanceParams;
    });

    modal.onAnyCloseEvent.subscribe(() => {
      this.onDestroy();
    });
  }

  ngOnDestroy(): void {
    this.onDestroy();
  }

  closeModal() {
    this.modalService.close(OTP_THRESHOLD_MODAL_ID);
  }

  onCompare(thresholds: OtpThresholdParams) {
    this.loading = true;
    this.errors = [];
    this.onTimeService
      .fetchOnTimeStats({
        ...this.params,
        filters: { ...this.params.filters, onTimeMaxMinutes: thresholds.late, onTimeMinMinutes: thresholds.early * -1 },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tableData.onTime.comparisonValue = this.setOtpValue(data.onTime, data.completed);
          this.tableData.early.comparisonValue = this.setOtpValue(data.early, data.completed);
          this.tableData.late.comparisonValue = this.setOtpValue(data.late, data.completed);
          this.loading = false;
        },
        error: () => {
          this.errors = [{ error: 'There was an issue comparing data, please try again.' }];
          this.loading = false;
        },
      });
  }

  private setOtpValue(value: number | undefined, completed: number | undefined): number | null {
    if (value !== undefined && completed !== undefined) {
      return value / completed;
    }
    return null;
  }

  private onDestroy() {
    this.loading = false;
    this.errors = [];
    this.destroy$.next();
    this.destroy$.complete();
  }
}
