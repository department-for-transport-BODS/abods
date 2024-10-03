import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Spectator, createComponentFactory, byText } from '@ngneat/spectator';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { RequestResetPasswordDocument } from 'src/generated/graphql';
import { UserService } from '../user.service';

import { ForgottenPasswordComponent } from './forgotten-password.component';

describe('ForgottenPasswordComponent', () => {
  let spectator: Spectator<ForgottenPasswordComponent>;
  let service: UserService;
  let controller: ApolloTestingController;

  const createComponent = createComponentFactory({
    component: ForgottenPasswordComponent,
    imports: [ReactiveFormsModule, ApolloTestingModule, SharedModule, LayoutModule, RouterTestingModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    service = spectator.inject(UserService);
    controller = spectator.inject(ApolloTestingController);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should show message if form submitted without email', () => {
    spyOn(service, 'requestResetPassword$').and.returnValue(of({ success: true }));

    spectator.detectChanges();
    spectator.click('form button');

    expect(service.requestResetPassword$).not.toHaveBeenCalled();
    expect(spectator.query(byText('Please enter a valid email address.'))).toBeTruthy();
  });

  it('should call service with email', () => {
    spyOn(service, 'requestResetPassword$').and.returnValue(of({ success: true }));

    const email = 'test@email.com';

    spectator.component.forgottenPasswordForm.controls.email.setValue(email);
    spectator.detectChanges();

    spectator.click('form button');

    expect(service.requestResetPassword$).toHaveBeenCalledTimes(1);
    expect(service.requestResetPassword$).toHaveBeenCalledWith(email);
  });

  it('should call graphql with email', async () => {
    const email = 'test@email.com';

    spectator.component.forgottenPasswordForm.controls.email.setValue(email);
    spectator.detectChanges();

    spectator.click('form button');

    const requestResetPassword = controller.expectOne(RequestResetPasswordDocument);

    requestResetPassword.flush({
      data: {
        requestResetPassword: {
          success: true,
          error: '',
        },
      },
    });

    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(requestResetPassword.operation.variables).toEqual(jasmine.objectContaining({ email }));
    controller.verify();
  });

  it('should show success message', () => {
    spyOn(service, 'requestResetPassword$').and.returnValue(of({ success: true }));

    const email = 'test@email.com';

    spectator.component.forgottenPasswordForm.controls.email.setValue(email);
    spectator.detectChanges();

    spectator.click('form button');

    expect(spectator.query(byText('Request received'))).toBeTruthy();
  });
});
