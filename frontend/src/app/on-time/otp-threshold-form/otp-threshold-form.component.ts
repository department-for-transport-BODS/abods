import { AfterViewInit, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject, takeUntil } from 'rxjs';
import { OTP_THRESHOLD_MODAL_ID } from '../otp-threshold-modal/otp-threshold-modal.component';
import { OtpThresholdDefaultsService } from './otp-threshold-defaults.service';

export interface OtpThresholdParams {
  late: number;
  early: number;
}

interface OtpThresholdForm {
  early: FormControl<number | null>;
  late: FormControl<number | null>;
}

@Component({
  selector: 'app-otp-threshold-form',
  templateUrl: './otp-threshold-form.component.html',
  styleUrls: ['./otp-threshold-form.component.scss'],
})
export class OtpThresholdFormComponent implements AfterViewInit, OnDestroy {
  @Output() compare = new EventEmitter<OtpThresholdParams>();

  form = this.fb.group<OtpThresholdForm>({
    early: this.fb.control(this.otpThresholdDefaultsService.early, [
      Validators.required,
      Validators.max(20),
      Validators.min(1),
    ]),
    late: this.fb.control(this.otpThresholdDefaultsService.late, [
      Validators.required,
      Validators.max(20),
      Validators.min(1),
    ]),
  });
  submitted = false;

  get early(): number {
    return Number(this.form.value.early);
  }
  set early(val: number) {
    this.form.controls.early.patchValue(val);
  }

  get late(): number {
    return Number(this.form.value.late);
  }
  set late(val: number) {
    this.form.controls.late.patchValue(val);
  }

  get error(): boolean {
    return this.form.invalid && this.submitted;
  }

  constructor(
    private fb: FormBuilder,
    private otpThresholdDefaultsService: OtpThresholdDefaultsService,
    private modalService: NgxSmartModalService
  ) {}

  private destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    const modal = this.modalService.getModal(OTP_THRESHOLD_MODAL_ID);

    modal.onOpen.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.early = this.otpThresholdDefaultsService.early;
      this.late = this.otpThresholdDefaultsService.late;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    this.submitted = true;
    if (!this.error) {
      this.compare.emit({ late: this.late, early: this.early });
      this.otpThresholdDefaultsService.early = this.early;
      this.otpThresholdDefaultsService.late = this.late;
    }
  }

  get formGroupClasses() {
    return {
      ['govuk-form-group']: true,
      ['govuk-form-group--error']: this.error,
    };
  }
}
