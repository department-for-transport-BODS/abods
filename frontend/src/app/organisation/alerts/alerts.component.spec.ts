import { RouterTestingModule } from '@angular/router/testing';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { of } from 'rxjs';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { AlertFragment, AlertTypeEnum, ScopeEnum } from 'src/generated/graphql';
import { OrganisationModule } from '../organisation.module';
import { OrganisationService } from '../organisation.service';

import { AlertsComponent } from './alerts.component';
import { EditAlertComponent } from './edit-alert/edit-alert.component';

describe('AlertsComponent', () => {
  let spectator: Spectator<AlertsComponent>;
  const createSpectator = createComponentFactory({
    component: AlertsComponent,
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

  let component: AlertsComponent;
  let service: OrganisationService;
  let authService: AuthenticatedUserService;

  beforeEach(() => {
    spectator = createSpectator();
    component = spectator.component;
    service = spectator.inject(OrganisationService);
    authService = spectator.inject(AuthenticatedUserService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should fetch user alerts', () => {
    const spy = spyOn(service, 'listUserAlerts$').and.returnValue(of([]));

    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith();
  });

  it('should show a nice message if no alerts are set up', () => {
    spyOn(service, 'listUserAlerts$').and.returnValue(of([]));

    spectator.detectChanges();

    expect(spectator.query(byText(/You don’t currently have any feed notifications/))).toBeTruthy();
  });

  let alertId = 1;

  function createAlert(
    alertType: AlertTypeEnum,
    userId: string,
    firstName: string | null,
    lastName: string | null,
    username = '',
    eventHysterisis?: number,
    eventThreshold?: number
  ): AlertFragment {
    return {
      alertId: (alertId++).toString(),
      alertType,
      sendTo: {
        id: userId,
        firstName,
        lastName,
        username,
      },
      eventHysterisis,
      eventThreshold,
    };
  }

  const vehicleCountAlerts: { alert: AlertFragment; expectedDisplay: string }[] = [
    {
      alert: createAlert(AlertTypeEnum.VehicleCountDisparity, '543', 'Mr', 'Zulu', '', undefined, 3),
      expectedDisplay: 'If more than 3 scheduled vehicles are missing from the feed send a notification to Mr Zulu',
    },
    {
      alert: createAlert(AlertTypeEnum.VehicleCountDisparity, '544', 'Jean Luc', 'Picard', '', undefined, 5),
      expectedDisplay:
        'If more than 5 scheduled vehicles are missing from the feed send a notification to Jean Luc Picard',
    },
    {
      alert: createAlert(AlertTypeEnum.VehicleCountDisparity, '545', 'Mr', 'Spock', '', undefined, 7),
      expectedDisplay: 'If more than 7 scheduled vehicles are missing from the feed send a notification to Mr Spock',
    },
    {
      alert: createAlert(AlertTypeEnum.VehicleCountDisparity, '546', null, null, 'Starfleet', undefined, 1),
      expectedDisplay: 'If more than 1 scheduled vehicles are missing from the feed send a notification to Starfleet',
    },
  ];

  it('should display vehicle count disparity alerts nicely', () => {
    spyOn(service, 'listUserAlerts$').and.returnValue(of(vehicleCountAlerts.map(({ alert }) => alert)));

    spectator.detectChanges();

    const alerts = spectator.queryAll('.user-alert');

    expect(alerts).toHaveLength(vehicleCountAlerts.length);

    alerts.forEach((alert, index) => {
      const { expectedDisplay } = vehicleCountAlerts[index];

      expect(alert).toHaveText(expectedDisplay);
    });
  });

  const feedFailureAlerts: { alert: AlertFragment; expectedDisplay: string }[] = [
    {
      alert: createAlert(AlertTypeEnum.FeedFailure, '547', 'Benjamin', 'Sisko', '', 11),
      expectedDisplay: '11 minutes after a feed failure send a notification to Benjamin Sisko',
    },
    {
      alert: createAlert(AlertTypeEnum.FeedFailure, '547', 'Benjamin', 'Sisko', '', 11),
      expectedDisplay: '11 minutes after a feed failure send a notification to Benjamin Sisko',
    },
    {
      alert: createAlert(AlertTypeEnum.FeedFailure, '548', 'Captain', 'Janeway', '', 1),
      expectedDisplay: '1 minute after a feed failure send a notification to Captain Janeway',
    },
    {
      alert: createAlert(AlertTypeEnum.FeedFailure, '549', null, null, 'DeepSpaceNine'),
      expectedDisplay: 'Immediately after a feed failure send a notification to DeepSpaceNine',
    },
  ];

  it('should display feed failure alerts nicely', () => {
    spyOn(service, 'listUserAlerts$').and.returnValue(of(feedFailureAlerts.map(({ alert }) => alert)));

    spectator.detectChanges();

    const alerts = spectator.queryAll('.user-alert');

    expect(alerts).toHaveLength(feedFailureAlerts.length);

    alerts.forEach((alert, index) => {
      const { expectedDisplay } = feedFailureAlerts[index];

      expect(alert).toHaveText(expectedDisplay);
    });
  });

  it('should allow admin user to edit any alert', async () => {
    const alert = createAlert(AlertTypeEnum.VehicleCountDisparity, '543', 'Mr', 'Zulu');
    spyOn(service, 'listUserAlerts$').and.returnValue(of([alert]));

    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(
      of({
        id: '546',
        username: 'Starfleet',
        roles: [{ id: '2', name: 'Administrator', scope: ScopeEnum.Organisation }],
      })
    );

    const fetchUserAlertSpy = spyOn(service, 'fetchUserAlert$').and.returnValue(of(alert));
    const openEditModalSpy = spyOn(component, 'openEditModal').and.callThrough();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const editAlertLink = spectator.query(byText('Edit', { selector: '.user-alert a' }));

    expect(editAlertLink).toBeTruthy();

    if (editAlertLink) {
      spectator.click(editAlertLink);

      await spectator.fixture.whenStable();

      expect(openEditModalSpy).toHaveBeenCalledWith(true);

      const editAlertComponent = spectator.query(EditAlertComponent);

      expect(editAlertComponent).toBeTruthy();

      expect(fetchUserAlertSpy).toHaveBeenCalledWith(alert.alertId as string);
    }
  });

  it('should allow staff user to edit own alerts', async () => {
    const alert = createAlert(AlertTypeEnum.VehicleCountDisparity, '543', 'Mr', 'Zulu');
    spyOn(service, 'listUserAlerts$').and.returnValue(of([alert]));

    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(
      of({
        id: '543',
        firstName: 'Mr',
        lastName: 'Zulu',
        username: '',
        roles: [{ id: '4', name: 'Staff', scope: ScopeEnum.Organisation }],
      })
    );

    const fetchUserAlertSpy = spyOn(service, 'fetchUserAlert$').and.returnValue(of(alert));
    const openEditModalSpy = spyOn(component, 'openEditModal').and.callThrough();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const editAlertLink = spectator.query(byText('Edit', { selector: '.user-alert a' }));

    expect(editAlertLink).toBeTruthy();

    if (editAlertLink) {
      spectator.click(editAlertLink);

      await spectator.fixture.whenStable();

      expect(openEditModalSpy).toHaveBeenCalledWith(true);

      const editAlertComponent = spectator.query(EditAlertComponent);

      expect(editAlertComponent).toBeTruthy();

      expect(fetchUserAlertSpy).toHaveBeenCalledWith(alert.alertId as string);
    }
  });

  it('should not allow staff user to edit other users alerts', async () => {
    const alert = createAlert(AlertTypeEnum.VehicleCountDisparity, '545', 'Mr', 'Spock');
    spyOn(service, 'listUserAlerts$').and.returnValue(of([alert]));

    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(
      of({
        id: '543',
        firstName: 'Mr',
        lastName: 'Zulu',
        username: '',
        roles: [{ id: '4', name: 'Staff', scope: ScopeEnum.Organisation }],
      })
    );

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const editAlertLink = spectator.query(byText('Edit', { selector: '.user-alert a' }));

    expect(editAlertLink).toBeFalsy();
  });
});
