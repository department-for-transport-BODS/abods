import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { byLabel, byText, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ScopeEnum } from 'src/generated/graphql';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { OrganisationModule } from '../organisation.module';
import { OrganisationService } from '../organisation.service';
import { UsersComponent } from '../users/users.component';
import { HelpdeskResolver } from '../../shared/resolvers/helpdesk.resolver';

const orgRoles = [
  {
    id: '2',
    scope: ScopeEnum.Organisation,
    name: 'Admin',
  },

  {
    id: '4',
    scope: ScopeEnum.Organisation,
    name: 'Staff',
  },
];

const users = [
  {
    id: '1',
    email: 'dennis@iwbaotn.uk',
    username: 'dennis@iwbaotn.uk',
    firstName: 'Dennis',
    lastName: 'Nordon',
    roles: [
      {
        id: '4',
        scope: ScopeEnum.Organisation,
        name: 'Staff',
      },
    ],
  },
  {
    id: '2',
    email: 'Kenneth@Horne.uk',
    username: 'Kenneth@Horne.uk',
    firstName: 'Kenneth',
    lastName: 'Horne',
    roles: [
      {
        id: '2',
        scope: ScopeEnum.Organisation,
        name: 'Admin',
      },
    ],
  },
  {
    id: '3',
    email: 'betty.marsden@mail.co.uk',
    username: 'betty.marsden@mail.co.uk',
    firstName: 'Betty',
    lastName: 'Marsden',
    roles: [
      {
        id: '4',
        scope: ScopeEnum.Organisation,
        name: 'Staff',
      },
    ],
  },
];

describe('EditUserComponent', () => {
  let spectator: SpectatorRouting<EditUserComponent>;
  const createSpectator = createRoutingFactory({
    component: EditUserComponent,
    imports: [
      SharedModule,
      LayoutModule,
      ApolloTestingModule,
      NgxSmartModalModule.forChild(),
      OrganisationModule,
      RouterTestingModule.withRoutes([
        {
          path: 'organisation/users',
          component: UsersComponent,
        },
      ]),
    ],
    mocks: [HelpdeskResolver],
    stubsEnabled: false,
    detectChanges: false,
  });

  let service: OrganisationService;
  let router: Router;

  beforeEach(() => {
    spectator = createSpectator();
    service = spectator.inject(OrganisationService);
    router = spectator.inject(Router);

    spyOn(service, 'listOrgRoles$').and.returnValue(of(orgRoles));
    spyOn(service, 'listUsers$').and.returnValue(of(users));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should should display details for user in list', async () => {
    const email = 'betty.marsden@mail.co.uk';
    const person = users.find((u) => email === u.email);

    spectator.setRouteParam('email', email);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byLabel('First name'))).toHaveValue(person?.firstName ?? '');
    expect(spectator.query(byLabel('Last name'))).toHaveValue(person?.lastName ?? '');
    expect(spectator.query(byLabel('Email address'))).toHaveValue(person?.username ?? '');
    expect(spectator.query(byLabel(person?.roles[0].name ?? ''))).toBeChecked();
  });

  it('should validate first name', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.typeInElement('', byLabel('First name'));

    const spy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText('This field is required.', { selector: '#user-first-name-error' }))).toBeTruthy();
  });

  it('should validate LAST name', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.typeInElement('', byLabel('Last name'));

    const spy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText('This field is required.', { selector: '#user-last-name-error' }))).toBeTruthy();
  });

  it('should allow editing of name and role', async () => {
    const username = 'betty.marsden@mail.co.uk';
    const person = users.find((u) => username === u.email);

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const firstName = 'NewFirstName';
    const lastName = 'NewLastName';

    spectator.typeInElement(firstName, byLabel('First name'));
    spectator.typeInElement(lastName, byLabel('Last name'));
    const role = orgRoles.find((r) => r.name !== person?.roles[0].name);
    spectator.click(byLabel(role?.name ?? ''));

    const spy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));
    spyOn(router, 'navigateByUrl');

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(username, firstName, lastName, role?.id ?? '');
  });

  it('should navigate back to list on cancel', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const spy = spyOn(router, 'navigateByUrl');

    spectator.click(byText('Cancel'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.calls.mostRecent().args[0].toString()).toEqual(`/organisation/users`);
  });

  it('should navigate back to list on save success', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const spy = spyOn(router, 'navigateByUrl');

    spyOn(service, 'editUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.calls.mostRecent().args[0].toString()).toEqual(`/organisation/users`);
  });

  it('should not navigate back to list but show error on save failure', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const spy = spyOn(router, 'navigateByUrl');

    const expectedError = 'This is the error';
    spyOn(service, 'editUser$').and.returnValue(of({ success: false, error: expectedError }));
    const consoleWarn = spyOn(console, 'warn');

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(0);
    expect(spectator.query(byText(expectedError))).toBeTruthy();
    expect(consoleWarn).toHaveBeenCalledWith('Edit user failed', expectedError);
  });

  it('should not allow editing of username', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.typeInElement('blahblah@gmail.com', byLabel('Email address'));

    const spy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));
    spyOn(router, 'navigateByUrl');

    spectator.click(byText('Save changes'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(username, jasmine.anything(), jasmine.anything(), jasmine.anything());
  });

  it('should check that the user really wants to revoke access', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const editSpy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));
    const removeSpy = spyOn(service, 'removeUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Remove'));

    expect(editSpy).toHaveBeenCalledTimes(0);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    expect(
      spectator.query(byText(new RegExp(`Are you sure you want to remove the account for ${username}`)))
    ).toBeTruthy();
  });

  it('should allow them to revoke access if the really want to', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const editSpy = spyOn(service, 'editUser$').and.returnValue(of({ success: true }));
    const removeSpy = spyOn(service, 'removeUser$').and.returnValue(of({ success: true }));

    spectator.click(byText('Remove'));

    expect(editSpy).toHaveBeenCalledTimes(0);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    const navigateSpy = spyOn(router, 'navigateByUrl');

    spectator.click(byText('Remove', { selector: '.modal button' }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(username);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy.calls.mostRecent().args[0].toString()).toEqual(`/organisation/users`);
  });

  it('should show an error if removing the account fails', async () => {
    const username = 'betty.marsden@mail.co.uk';

    spectator.setRouteParam('email', username);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const expectedError = 'This is the error removing';
    const removeSpy = spyOn(service, 'removeUser$').and.returnValue(of({ success: false, error: expectedError }));
    const consoleWarn = spyOn(console, 'warn');

    spectator.click(byText('Remove'));

    const navigateSpy = spyOn(router, 'navigateByUrl');

    spectator.click(byText('Remove', { selector: '.modal button' }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledTimes(0);

    expect(spectator.query(byText(expectedError))).toBeTruthy();
    expect(consoleWarn).toHaveBeenCalledWith('Remove user failed', expectedError);
  });
});
