import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { InvitationDocument, SignUpDocument } from 'src/generated/graphql';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let controller: ApolloTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
    });
    service = TestBed.inject(UserService);
    controller = TestBed.inject(ApolloTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call signup query', fakeAsync(() => {
    const obs = service.signUp$('key', 'password', 'firstName', 'lastName');

    expect(obs).not.toBeNull();
    obs.subscribe(() => {
      const signUp = controller.expectOne(SignUpDocument);
      signUp.flush({
        data: {
          signUp: {
            success: true,
            error: '',
          },
        },
      });

      expect(signUp.operation.variables.params).toEqual(
        jasmine.objectContaining({ key: 'key', password: 'password', firstName: 'firstName', lastName: 'lastName' })
      );
      controller.verify();
    });
    flush();
  }));

  it('should fetch invitation', fakeAsync(() => {
    const obs = service.invitation$('key');

    expect(obs).not.toBeNull();
    obs.subscribe(() => {
      const invitation = controller.expectOne(InvitationDocument);
      invitation.flush({
        data: {
          signUp: {
            email: true,
            accepted: false,
          },
        },
      });

      expect(invitation.operation.variables.key).toEqual('key');
      controller.verify();
    });
    flush();
  }));
});
