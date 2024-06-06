import { byLabel, byText, byTextContent, createHostFactory, SpectatorHost } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { NgxSmartModalModule, NgxSmartModalService } from 'ngx-smart-modal';
import { of } from 'rxjs';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { OrganisationModule } from 'src/app/organisation/organisation.module';
import { OrganisationService } from 'src/app/organisation/organisation.service';
import { ScopeEnum } from 'src/generated/graphql';
import { SharedModule } from '../../shared.module';

import { InviteUserModalComponent } from './invite-user-modal.component';

const orgRoles = [
  {
    id: '2',
    scope: ScopeEnum.Organisation,
    name: 'Administrator',
  },

  {
    id: '4',
    scope: ScopeEnum.Organisation,
    name: 'Staff',
  },
];

describe('InviteUserModalComponent', () => {
  let spectator: SpectatorHost<InviteUserModalComponent>;
  let authService: AuthenticatedUserService;
  let service: OrganisationService;
  let ngxService: NgxSmartModalService;

  const createHost = createHostFactory({
    component: InviteUserModalComponent,
    imports: [SharedModule, ApolloTestingModule, NgxSmartModalModule, OrganisationModule],
    providers: [NgxSmartModalService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createHost(`<app-invite-user-modal> </app-invite-user-modal>`);
    spectator.component.identifier = 'inviteUser';
    service = spectator.inject(OrganisationService);
    authService = spectator.inject(AuthenticatedUserService);
    ngxService = spectator.inject(NgxSmartModalService);
    spectator.component.ngOnInit();

    spyOn(service, 'listOrgRoles$').and.returnValue(of(orgRoles));
    spyOnProperty(authService, 'authenticatedUser$').and.returnValue(
      of({
        roles: [{ name: 'Administrator', scope: 'organisation' }],
        organisation: { id: '43' },
      })
    );

    spectator.detectChanges();
    ngxService.open('inviteUser');
  });

  it('should allow org admin to invite a new user', async () => {
    const organisationId = '43';
    const inviteEmail = 'email@domain.com';
    const inviteRole = orgRoles[1];

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byTextContent(/Invite a user/, { selector: '.modal' }))).toBeTruthy();

    spectator.typeInElement(inviteEmail, byLabel('Email address'));
    spectator.blur(byLabel('Email address'));
    spectator.click(byLabel(inviteRole.name));

    const inviteUserSpy = spyOn(service, 'inviteUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Invite user'));

    expect(inviteUserSpy).toHaveBeenCalledTimes(1);
    expect(inviteUserSpy).toHaveBeenCalledWith(inviteEmail, inviteRole.id, organisationId);
  });

  it('should not allow org staff to invite a new user', async () => {
    const inviteButton = spectator.query(byText('Invite a new user', { selector: 'button' }));

    expect(inviteButton).toBeFalsy();
  });

  it('should validate invite email', async () => {
    const inviteUserSpy = spyOn(service, 'inviteUser$').and.returnValue(of({ success: true }));
    spectator.typeInElement('thisisnotanemailaddress', byLabel('Email address'));
    spectator.blur(byLabel('Email address'));

    spectator.click(byLabel('Staff'));

    spectator.click(byText('Invite user'));

    expect(inviteUserSpy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText(/valid email address/))).toBeTruthy();
  });

  it('should require invite email', async () => {
    const inviteUserSpy = spyOn(service, 'inviteUser$').and.returnValue(of({ success: true }));
    spectator.click(byLabel('Staff'));

    spectator.click(byText('Invite user'));

    expect(inviteUserSpy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText('This field is required.'))).toBeTruthy();
  });

  it('should require invite role', async () => {
    const inviteUserSpy = spyOn(service, 'inviteUser$').and.returnValue(of({ success: true }));
    spectator.typeInElement('this@isanemail.address', byLabel('Email address'));
    spectator.blur(byLabel('Email address'));

    spectator.click(byText('Invite user'));

    expect(inviteUserSpy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText('This field is required.'))).toBeTruthy();
  });

  it('should show error if invite fails', async () => {
    const errorMessage = 'Invite failed error';

    spectator.typeInElement('email@address.com', byLabel('Email address'));
    spectator.blur(byLabel('Email address'));

    spectator.click(byLabel('Staff'));

    const consoleWarn = spyOn(console, 'warn');
    spyOn(service, 'inviteUser$').and.returnValue(of({ success: false, error: errorMessage }));

    spectator.click(byText('Invite user'));

    expect(spectator.query(byText(errorMessage))).toBeTruthy();
    expect(consoleWarn).toHaveBeenCalledWith('Error inviting user', errorMessage);
  });
});
