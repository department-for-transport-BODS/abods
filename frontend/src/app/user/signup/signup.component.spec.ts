import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { byLabel, byText, byTextContent, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { UserService } from '../user.service';

import { SignupComponent } from './signup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SignUpDocument } from 'src/generated/graphql';
import { discardPeriodicTasks, fakeAsync } from '@angular/core/testing';
import { LayoutModule } from 'src/app/layout/layout.module';

describe('SignupComponent', () => {
  let spectator: SpectatorRouting<SignupComponent>;
  let service: UserService;
  let controller: ApolloTestingController;
  const createComponent = createRoutingFactory({
    component: SignupComponent,
    imports: [ReactiveFormsModule, ApolloTestingModule, SharedModule, LayoutModule],
  });

  afterAll(() => controller.verify());

  beforeEach(() => {
    spectator = createComponent();
    service = spectator.inject(UserService);
    controller = spectator.inject(ApolloTestingController);
  });

  it('should fetch invitation with the key in the url.', () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));

    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.invitation$).toHaveBeenCalledWith('a-key');
  });

  it('should show message if invitation is already accepted.', async () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: true }));

    await spectator.fixture.whenStable();
    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^This invitation has already been accepted or has expired\./, {
          selector: '#invitation-notfound',
        })
      )
    ).toBeTruthy();
  });

  it('should require firstName', () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    spectator.component.firstName?.setValue('Kevin');
    spectator.component.password?.setValue('passW0rd!');
    spectator.component.confirmPassword?.setValue('passW0rd!');
    spectator.component.onSubmit();
    spyOn(service, 'signUp$');

    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.signUp$).not.toHaveBeenCalled();
  });

  [' ', '   ', '1029292', '"%&$%"$%'].forEach((testCase) => {
    it(`should not accept "${testCase}" as firstName`, () => {
      spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
      spectator.component.lastName?.setValue('Bacon');
      spectator.component.password?.setValue('passW0rd!');
      spectator.component.confirmPassword?.setValue('passW0rd!');

      spectator.setRouteParam('key', 'a-key');

      spectator.detectChanges();

      spectator.typeInElement(testCase, byLabel(/First name/));

      spyOn(service, 'signUp$').and.returnValue(of({ success: false }));

      spectator.component.onSubmit();

      spectator.detectChanges();

      expect(service.signUp$).not.toHaveBeenCalled();

      expect(spectator.query(byText(/Name contains an invalid character/))).toExist();
    });
  });

  ['Kevin', 'Jérémie François', '     Timothy    ', '麗'].forEach((testCase) => {
    it(`should accept "${testCase}" as firstName`, () => {
      spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
      spectator.component.lastName?.setValue('Bacon');
      spectator.component.password?.setValue('passW0rd!');
      spectator.component.confirmPassword?.setValue('passW0rd!');

      spectator.setRouteParam('key', 'a-key');

      spectator.detectChanges();

      spectator.typeInElement(testCase, byLabel(/First name/));

      spyOn(service, 'signUp$').and.returnValue(of({ success: true }));

      spectator.component.onSubmit();

      spectator.detectChanges();

      expect(service.signUp$).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.anything(),
        testCase.trim(),
        jasmine.anything()
      );
    });
  });

  it('should require lastName', () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    spectator.component.firstName?.setValue('Kevin');
    spectator.component.password?.setValue('passW0rd!');
    spectator.component.confirmPassword?.setValue('passW0rd!');
    spectator.component.onSubmit();
    spyOn(service, 'signUp$');

    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.signUp$).not.toHaveBeenCalled();
  });

  [' ', '   ', '1055592', '"%&$$$$%"$%'].forEach((testCase) => {
    it(`should not accept "${testCase}" as lastName`, () => {
      spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
      spectator.component.firstName?.setValue('Kevin');
      spectator.component.password?.setValue('passW0rd!');
      spectator.component.confirmPassword?.setValue('passW0rd!');

      spectator.setRouteParam('key', 'a-key');

      spectator.detectChanges();

      spectator.typeInElement(testCase, byLabel(/Last name/));

      spyOn(service, 'signUp$').and.returnValue(of({ success: false }));

      spectator.component.onSubmit();

      spectator.detectChanges();

      expect(service.signUp$).not.toHaveBeenCalled();

      expect(spectator.query(byText(/Name contains an invalid character/))).toExist();
    });
  });

  ['Bacon', `O'Connor`, 'Tollemache-Tollemache', ' Landry III ', 'Bäumler', '黄'].forEach((testCase) => {
    it(`should accept "${testCase}" as lastName`, () => {
      spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
      spectator.component.firstName?.setValue('Kevin');
      spectator.component.password?.setValue('passW0rd!');
      spectator.component.confirmPassword?.setValue('passW0rd!');

      spectator.setRouteParam('key', 'a-key');

      spectator.detectChanges();

      spectator.typeInElement(testCase, byLabel(/Last name/));

      spyOn(service, 'signUp$').and.returnValue(of({ success: true }));

      spectator.component.onSubmit();

      spectator.detectChanges();

      expect(service.signUp$).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.anything(),
        jasmine.anything(),
        testCase.trim()
      );
    });
  });

  it('should not send sign-up request if password is not valid.', () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    spectator.component.firstName?.setValue('Kevin');
    spectator.component.lastName?.setValue('Bacon');
    spectator.component.password?.setValue('passw0rd');
    spectator.component.confirmPassword?.setValue('passw0rd');
    spectator.component.onSubmit();
    spyOn(service, 'signUp$').and.returnValue(of({ success: false }));

    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.signUp$).toHaveBeenCalledTimes(0);
  });

  it('should send sign-up request if password is valid.', async () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    spectator.setRouteParam('key', 'a-key');
    await spectator.fixture.whenStable();

    spectator.component.firstName?.setValue('Kevin');
    spectator.component.lastName?.setValue('Bacon');
    spectator.component.password?.setValue('Passw0rd!');
    spectator.component.confirmPassword?.setValue('Passw0rd!');
    spyOn(service, 'signUp$').and.returnValue(of({ success: true }));

    spectator.component.onSubmit();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(service.signUp$).toHaveBeenCalledWith('a-key', 'Passw0rd!', 'Kevin', 'Bacon');
  });

  it('should not send sign-up request if password is valid but does not match Confirm.', async () => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    spectator.setRouteParam('key', 'a-key');
    await spectator.fixture.whenStable();

    spectator.component.firstName?.setValue('Kevin');
    spectator.component.lastName?.setValue('Bacon');
    spectator.component.password?.setValue('Passw0rd!');
    spectator.component.confirmPassword?.setValue('Passw0rd£');
    spyOn(service, 'signUp$').and.returnValue(of({ success: true }));

    spectator.component.onSubmit();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(service.signUp$).not.toHaveBeenCalled();
  });

  it('should show success banner if sign-up succeeds.', fakeAsync(() => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    const key = 'a-key';

    spectator.setRouteParam('key', key);
    spectator.tick();

    const password = 'Passw0rd!';
    spectator.component.key?.setValue(key);
    spectator.component.firstName?.setValue('Kevin');
    spectator.component.lastName?.setValue('Bacon');
    spectator.component.password?.setValue(password);
    spectator.component.confirmPassword?.setValue(password);

    spectator.component.onSubmit();
    const signUp = controller.expectOne(SignUpDocument);
    signUp.flush({
      data: {
        signUp: {
          success: true,
          error: '',
        },
      },
    });
    spectator.tick();

    expect(signUp.operation.variables.key).toEqual(key);
    expect(signUp.operation.variables.password).toEqual(password);
    controller.verify();

    expect(spectator.query('#signup-success')).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should show error if sign-up fails.', fakeAsync(() => {
    spyOn(service, 'invitation$').and.returnValue(of({ email: 'foo@bar.com', accepted: false }));
    const key = 'a-key';

    spectator.setRouteParam('key', key);
    spectator.tick();

    const password = 'Passw0rd!';
    spectator.component.key?.setValue(key);
    spectator.component.firstName?.setValue('Kevin');
    spectator.component.lastName?.setValue('Bacon');
    spectator.component.password?.setValue(password);
    spectator.component.confirmPassword?.setValue(password);

    spectator.component.onSubmit();
    const signUp = controller.expectOne(SignUpDocument);
    signUp.flush({
      data: {
        signUp: {
          success: false,
          error: 'sign-up failed',
        },
      },
    });
    spectator.tick();

    expect(signUp.operation.variables.key).toEqual(key);
    expect(signUp.operation.variables.password).toEqual(password);
    controller.verify();

    expect(spectator.query('#signup-error')).toBeTruthy();
    discardPeriodicTasks();
  }));
});
