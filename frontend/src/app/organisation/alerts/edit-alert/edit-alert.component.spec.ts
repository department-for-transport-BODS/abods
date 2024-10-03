import { RouterTestingModule } from '@angular/router/testing';
import { Spectator, createComponentFactory, byLabel, byText } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { of } from 'rxjs';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { AlertTypeEnum, ScopeEnum } from 'src/generated/graphql';
import { OrganisationModule } from '../../organisation.module';
import { OrganisationService } from '../../organisation.service';

import { EditAlertComponent } from './edit-alert.component';

const feedFailureAlert = {
  alertId: '66',
  alertType: AlertTypeEnum.FeedFailure,
  sendTo: {
    id: '13',
    username: 'SendToUsername',
  },
  eventHysterisis: 15,
};

const vehicleDisparityAlert = {
  alertId: '67',
  alertType: AlertTypeEnum.VehicleCountDisparity,
  sendTo: {
    id: '13',
    username: 'SendToUsername',
  },
  eventThreshold: 10,
};

const adminUser = {
  id: '13',
  username: 'AdminUser',
  email: 'email@address.com',
  roles: [
    {
      id: '2',
      name: 'Administrator',
      scope: ScopeEnum.Organisation,
    },
  ],
};
const staffUser = {
  id: '14',
  username: 'StaffUser',
  email: 'other.email@address.com',
  roles: [{ id: '4', name: 'Staff', scope: ScopeEnum.Organisation }],
};

const users = [adminUser, staffUser];

describe('EditAlertComponent', () => {
  let spectator: Spectator<EditAlertComponent>;
  let component: EditAlertComponent;
  let service: OrganisationService;
  let authService: AuthenticatedUserService;

  const createComponent = createComponentFactory({
    component: EditAlertComponent,
    imports: [
      SharedModule,
      LayoutModule,
      ApolloTestingModule,
      NgxSmartModalModule.forChild(),
      OrganisationModule,
      RouterTestingModule,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(OrganisationService);
    authService = spectator.inject(AuthenticatedUserService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should fetch alert details', () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    const spy = spyOn(service, 'fetchUserAlert$').and.returnValue(of(null));
    component.editAlert('42');

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith('42');
  });

  it('should emit openEdit on create', () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    const emitSpy = spyOn(component.openEdit, 'emit');

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it('should emit openEdit on edit', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(vehicleDisparityAlert));

    const emitSpy = spyOn(component.openEdit, 'emit');

    component.editAlert(vehicleDisparityAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should load feed failure event correctly', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert(feedFailureAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byLabel('Feed failure'))).toBeChecked();

    expect(spectator.query(byLabel('If vehicle data has been missing for more than'))).toHaveValue(
      feedFailureAlert.eventHysterisis.toString()
    );

    expect(spectator.query(byLabel('Send a notification to'))).toHaveSelectedOptions(feedFailureAlert.sendTo.id);
  });

  it('should load vehicle count disparity event correctly', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(vehicleDisparityAlert));

    component.editAlert(vehicleDisparityAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byLabel('Vehicle count disparity'))).toBeChecked();

    expect(spectator.query(byLabel('If the count disparity is greater than'))).toHaveValue(
      vehicleDisparityAlert.eventThreshold.toString()
    );

    expect(spectator.query(byLabel('Send a notification to'))).toHaveSelectedOptions(
      vehicleDisparityAlert.sendTo.id.toString()
    );
  });

  it('should validate alert type', () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    const createSpy = spyOn(service, 'createUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Create notification'));

    expect(createSpy).not.toHaveBeenCalled();
    expect(byText('Please select a notification type')).toBeTruthy();
  });

  it('should not allow 0 eventThreshold', () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    spectator.click(byLabel('Vehicle count disparity'));

    const createSpy = spyOn(service, 'createUserAlert$').and.returnValue(of({ success: true }));

    spectator.typeInElement('0', byLabel('If the count disparity is greater than'));

    spectator.click(byText('Create notification'));

    expect(createSpy).not.toHaveBeenCalled();
    expect(byText('Value must be at least 1')).toBeTruthy();
  });

  it('should not allow staff user to change sendToId', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(staffUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(
      of({
        alertId: '66',
        alertType: AlertTypeEnum.FeedFailure,
        sendTo: staffUser,
        eventHysterisis: 20,
      })
    );

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byLabel('Send a notification to'))).toBeDisabled();
  });

  it('should update existing alert on save', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(staffUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(
      of({
        alertId: '66',
        alertType: AlertTypeEnum.FeedFailure,
        sendTo: staffUser,
        eventHysterisis: 20,
      })
    );

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.click(byLabel('Vehicle count disparity'));

    spectator.click(byLabel('If the count disparity is greater than'));

    spectator.typeInElement('15', byLabel('If the count disparity is greater than'));

    spectator.selectOption(byLabel('Send a notification to'), staffUser.id);

    const updateSpy = spyOn(service, 'updateUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Update notification', { selector: 'button' }));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(updateSpy).toHaveBeenCalledWith('66', AlertTypeEnum.VehicleCountDisparity, staffUser.id, 0, 15);
  });

  it('should create new alert on save', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    component.createAlert();

    await spectator.fixture.whenStable();

    spectator.click(byLabel('Feed failure'));

    spectator.selectOption(byLabel('If vehicle data has been missing for more than'), '10');

    spectator.selectOption(byLabel('Send a notification to'), adminUser.id);

    const createSpy = spyOn(service, 'createUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Create notification', { selector: 'button' }));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(createSpy).toHaveBeenCalledWith(AlertTypeEnum.FeedFailure, adminUser.id, 10, 0);
  });

  it('should allow existing alert to be deleted', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const deleteSpy = spyOn(service, 'deleteUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Delete'));
    await spectator.fixture.whenStable();

    expect(deleteSpy).not.toHaveBeenCalled();

    spectator.click(byText('Yes, please delete'));
    await spectator.fixture.whenStable();

    expect(deleteSpy).toHaveBeenCalledWith(feedFailureAlert.alertId);
  });

  it('should now allow alert to be deleted before its created', () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    expect(spectator.query(byText('Delete'))).toBeFalsy();
  });

  it('should emit closeEdit after successful update', async () => {
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert(feedFailureAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'updateUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Update notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(closeEditSpy).toHaveBeenCalledWith();
  });

  it('should emit closeEdit after successful create', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    component.createAlert();

    await spectator.fixture.whenStable();

    spectator.click(byLabel('Feed failure'));

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'createUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Create notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(closeEditSpy).toHaveBeenCalledWith();
  });

  it('should emit closeEdit after successful delete', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'deleteUserAlert$').and.returnValue(of({ success: true }));

    spectator.click(byText('Delete'));
    await spectator.fixture.whenStable();

    expect(closeEditSpy).not.toHaveBeenCalled();

    spectator.click(byText('Yes, please delete'));
    await spectator.fixture.whenStable();

    expect(closeEditSpy).toHaveBeenCalledWith();
  });

  it('should display error message on failed update', async () => {
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert(feedFailureAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spyOn(service, 'updateUserAlert$').and.returnValue(of({ success: false, error: 'Update alert error to be shown' }));

    spectator.click(byText('Update notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(spectator.query(byText('Update alert error to be shown'))).toBeTruthy();
  });

  it('should not emit closeEdit after failed update', async () => {
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert(feedFailureAlert.alertId);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'updateUserAlert$').and.returnValue(of({ success: false, error: 'Update alert error' }));

    spectator.click(byText('Update notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(closeEditSpy).toHaveBeenCalledTimes(0);
  });

  it('should display error message on failed create', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    spectator.click(byLabel('Feed failure'));

    spyOn(service, 'createUserAlert$').and.returnValue(of({ success: false, error: 'Create alert error to be shown' }));

    spectator.click(byText('Create notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(spectator.query(byText('Create alert error to be shown'))).toBeTruthy();
  });

  it('should not emit closeEdit after failed create', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));

    spectator.detectChanges();

    component.createAlert();

    spectator.detectChanges();

    spectator.click(byLabel('Feed failure'));

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'createUserAlert$').and.returnValue(of({ success: false, error: 'Create alert error' }));

    spectator.click(byText('Create notification', { selector: 'button' }));

    await spectator.fixture.whenStable();

    expect(closeEditSpy).not.toHaveBeenCalled();
  });

  it('should display error message on failed delete', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spyOn(service, 'deleteUserAlert$').and.returnValue(of({ success: false, error: 'Delete alert error to be shown' }));

    spectator.click(byText('Delete'));
    await spectator.fixture.whenStable();

    spectator.click(byText('Yes, please delete'));
    await spectator.fixture.whenStable();

    expect(spectator.query(byText('Delete alert error to be shown'))).toBeTruthy();
  });

  it('should not emit closeEdit after failed delete', async () => {
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(of(adminUser));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
    spyOn(service, 'fetchUserAlert$').and.returnValue(of(feedFailureAlert));

    component.editAlert('66');

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const closeEditSpy = spyOn(component.closeEdit, 'emit');
    spyOn(service, 'deleteUserAlert$').and.returnValue(of({ success: false, error: 'Delete alert error to be shown' }));

    spectator.click(byText('Delete'));
    await spectator.fixture.whenStable();

    spectator.click(byText('Yes, please delete'));
    await spectator.fixture.whenStable();

    expect(closeEditSpy).toHaveBeenCalledTimes(0);
  });
});
