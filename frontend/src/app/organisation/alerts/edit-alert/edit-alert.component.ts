import { EventEmitter, OnDestroy } from '@angular/core';
import { Component, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { AlertFragment, AlertTypeEnum, UserFragment } from 'src/generated/graphql';
import { OrganisationService } from '../../organisation.service';

@Component({
  selector: 'app-edit-alert',
  templateUrl: './edit-alert.component.html',
  styleUrls: ['./edit-alert.component.scss'],
})
export class EditAlertComponent implements OnInit, OnDestroy {
  @Output() closeEdit = new EventEmitter();
  @Output() openEdit = new EventEmitter<boolean>();

  subs: Subscription[] = [];

  users: UserFragment[] = [];

  confirmDeleteAlert = false;

  alertForm: FormGroup;

  AlertTypeEnum = AlertTypeEnum;

  errors: FormErrors[] = [];
  submitted = false;
  authenticatedUser: UserFragment | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private organisationService: OrganisationService,
    private authService: AuthenticatedUserService
  ) {
    this.alertForm = this.formBuilder.group({
      alertId: '',
      alertType: ['', Validators.required],
      eventThreshold: [1],
      sendToId: [{ value: '', disabled: true }, Validators.required],
      eventHysterisis: ['5'],
    });
  }

  ngOnInit(): void {
    this.subs.push(
      this.organisationService.listUsers$().subscribe((users) => {
        this.users = users;
      }),
      this.authService.authenticatedUser$.subscribe((user) => {
        this.authenticatedUser = user;
        if (user?.roles.some(({ name }) => name === 'Administrator')) {
          this.alertForm.get('sendToId')?.enable();
        }
      })
    );
    if (this.alertTypeControl) {
      this.subs.push(
        this.alertTypeControl.valueChanges.subscribe((type) => {
          this.updateConditionalValidation(type);
        })
      );
    }
  }

  updateConditionalValidation(type: AlertTypeEnum) {
    const ctrl = this.alertForm.get('eventThreshold');
    ctrl?.setValidators(type === AlertTypeEnum.VehicleCountDisparity ? [Validators.required, Validators.min(1)] : []);
    ctrl?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub?.unsubscribe());
  }

  loadAlert({ alertId, alertType, eventHysterisis, eventThreshold, sendTo }: AlertFragment) {
    const value = {
      alertId: alertId ?? '',
      alertType: alertType ?? '',
      eventHysterisis: eventHysterisis ?? 5,
      eventThreshold: eventThreshold ?? 1,
      sendToId: sendTo?.id ?? this.authenticatedUser?.id ?? '',
    };

    this.errors = [];
    this.confirmDeleteAlert = false;
    this.submitted = false;
    this.alertForm.setValue(value);
    this.alertForm.markAsUntouched();
    this.alertForm.markAsPristine();
  }

  editAlert(alertId: string) {
    this.subs.push(
      this.organisationService.fetchUserAlert$(alertId).subscribe((alert) => {
        this.loadAlert(alert ?? {});
        this.openEdit.emit(this.editing);
      })
    );
  }

  createAlert() {
    this.loadAlert({});
    this.openEdit.emit(false);
  }

  userDisplayName({ firstName, lastName, username }: UserFragment) {
    if (firstName && firstName !== '' && lastName) {
      return `${firstName} ${lastName}`;
    }
    return username;
  }

  onSubmit() {
    this.errors = [];

    if (this.submitted) {
      return;
    }

    if (this.alertForm?.invalid) {
      this.alertForm.markAllAsTouched();
      return;
    }

    this.submitted = true;

    if (this.editing) {
      this.subs.push(
        this.organisationService
          .updateUserAlert$(this.alertId, this.alertType, this.sendToId, this.eventHysterisis, this.eventThreshold)
          .subscribe(({ success, error }) => {
            if (success) {
              this.closeEdit.emit();
            } else {
              this.errors = [{ error: error ?? 'There was an error updating the alert' }];
              this.submitted = false;
            }
          })
      );
    } else {
      this.subs.push(
        this.organisationService
          .createUserAlert$(this.alertType, this.sendToId, this.eventHysterisis, this.eventThreshold)
          .subscribe(({ success, error }) => {
            if (success) {
              this.closeEdit.emit();
            } else {
              this.errors = [{ error: error ?? 'There was an error creating the alert' }];
              this.submitted = false;
            }
          })
      );
    }
  }

  onDelete() {
    this.errors = [];

    if (this.submitted) {
      return;
    }

    this.submitted = true;

    this.subs.push(
      this.organisationService.deleteUserAlert$(this.alertId).subscribe(({ success, error }) => {
        if (success) {
          this.closeEdit.emit();
        } else {
          this.errors = [{ error: error ?? 'There was an error deleting the alert' }];
          this.submitted = false;
        }
      })
    );
  }

  get alertId() {
    return this.alertForm.get('alertId')?.value as string;
  }

  get alertTypeControl() {
    return this.alertForm.get('alertType');
  }

  get alertType() {
    return this.alertTypeControl?.value as AlertTypeEnum;
  }

  get sendToId() {
    return this.alertForm.get('sendToId')?.value as string;
  }

  get eventHysterisis() {
    switch (this.alertType) {
      case AlertTypeEnum.FeedFailure:
        return parseInt(this.alertForm.get('eventHysterisis')?.value, 10);
    }

    return 0;
  }

  get eventThreshold() {
    switch (this.alertType) {
      case AlertTypeEnum.VehicleCountDisparity:
        return parseInt(this.alertForm.get('eventThreshold')?.value, 10);
    }
    return 0;
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(controlName: string, prop: AbstractControl) {
    if (prop.errors?.required) {
      if (controlName === 'alertType') {
        return 'Please select a notification type';
      }
      return 'This field is required.';
    } else if (prop.errors?.min) {
      const { min } = prop.errors?.min ?? '';
      return `Value must be at least ${min}`;
    }
  }

  getError(controlName: string) {
    const prop = this.alertForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(controlName, prop);
    }
  }

  get editing() {
    return !!this.alertId;
  }
}
