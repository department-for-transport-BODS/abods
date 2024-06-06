import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { byTextContent, createRoutingFactory, SpectatorRouting } from '@ngneat/spectator';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { UserService } from '../user.service';

import { ResetPasswordComponent } from './reset-password.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ResetPasswordDocument } from 'src/generated/graphql';
import { discardPeriodicTasks, fakeAsync } from '@angular/core/testing';
import { LayoutModule } from 'src/app/layout/layout.module';

describe('ResetPasswordComponent', () => {
  let spectator: SpectatorRouting<ResetPasswordComponent>;
  let service: UserService;
  let controller: ApolloTestingController;
  const createComponent = createRoutingFactory({
    component: ResetPasswordComponent,
    imports: [ReactiveFormsModule, ApolloTestingModule, SharedModule, LayoutModule],
  });

  afterAll(() => controller.verify());

  beforeEach(() => {
    spectator = createComponent();
    service = spectator.inject(UserService);
    controller = spectator.inject(ApolloTestingController);
  });

  it('should check token still valid.', () => {
    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(true));

    spectator.setRouteParam('uid', 'a-uid');
    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.verifyResetPasswordToken$).toHaveBeenCalledWith('a-uid', 'a-key');
  });

  it('should show message if token is invalid.', async () => {
    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(false));

    await spectator.fixture.whenStable();

    spectator.setRouteParam('uid', 'a-uid');
    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent(/^This reset password link has already been used or has expired./, {
          selector: '#key-notfound',
        })
      )
    ).toBeTruthy();
  });

  it('should not reset password if is not valid.', () => {
    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(true));
    spectator.component.password?.setValue('passw0rd');
    spectator.component.confirmPassword?.setValue('passw0rd');
    spectator.component.onSubmit();
    spyOn(service, 'resetPassword$');

    spectator.setRouteParam('uid', 'a-uid');
    spectator.setRouteParam('key', 'a-key');

    spectator.detectChanges();

    expect(service.resetPassword$).toHaveBeenCalledTimes(0);
  });

  it('should reset password if password is valid.', async () => {
    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(true));
    spectator.setRouteParam('uid', 'a-uid');
    spectator.setRouteParam('key', 'a-key');
    await spectator.fixture.whenStable();

    spectator.component.password?.setValue('Passw0rd!');
    spectator.component.confirmPassword?.setValue('Passw0rd!');
    spyOn(service, 'resetPassword$').and.returnValue(of({ success: true }));

    spectator.component.onSubmit();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(service.resetPassword$).toHaveBeenCalledWith('a-uid', 'a-key', 'Passw0rd!', 'Passw0rd!');
  });

  it('should show success banner if sign-up succeeds.', fakeAsync(() => {
    const uid = 'a-uid';
    const token = 'a-key';
    const password = 'Passw0rd!';

    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(true));
    spectator.setRouteParam('key', token);
    spectator.setRouteParam('uid', uid);

    spectator.tick();

    spectator.component.password?.setValue(password);
    spectator.component.confirmPassword?.setValue(password);

    spectator.component.onSubmit();
    const resetPassword = controller.expectOne(ResetPasswordDocument);
    resetPassword.flush({
      data: {
        resetPassword: {
          success: true,
          error: '',
        },
      },
    });
    spectator.tick();

    expect(resetPassword.operation.variables.uid).toEqual(uid);
    expect(resetPassword.operation.variables.token).toEqual(token);
    expect(resetPassword.operation.variables.password).toEqual(password);
    expect(resetPassword.operation.variables.confirmPassword).toEqual(password);
    controller.verify();

    expect(spectator.query('#reset-password-success')).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should show error if sign-up fails.', fakeAsync(() => {
    spyOn(service, 'verifyResetPasswordToken$').and.returnValue(of(true));
    const uid = 'a-uid';
    const token = 'a-key';

    spectator.setRouteParam('key', token);
    spectator.setRouteParam('uid', uid);

    spectator.tick();

    const password = 'Passw0rd!';
    spectator.component.password?.setValue(password);
    spectator.component.confirmPassword?.setValue(password);

    spectator.component.onSubmit();
    const resetPassword = controller.expectOne(ResetPasswordDocument);
    resetPassword.flush({
      data: {
        resetPassword: {
          success: false,
          error: 'reset failed',
        },
      },
    });
    spectator.tick();
    controller.verify();

    expect(spectator.query('#reset-password-error')).toBeTruthy();
    discardPeriodicTasks();
  }));
});
