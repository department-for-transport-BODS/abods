import { Injectable } from '@angular/core';
import { GraphQLError } from 'graphql';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InvitationGQL,
  InvitationType,
  RequestResetPasswordGQL,
  ResetPasswordGQL,
  SignUpGQL,
  VerifyResetPasswordTokenGQL,
} from 'src/generated/graphql';

interface UserMutationResponse {
  error?: string | null;
  success: boolean;
}

const failureResponse = (error: string): UserMutationResponse => ({ error, success: false });

const serverFailureResponse: UserMutationResponse = failureResponse(
  'There was an error communicating with the server, please try again.'
);

const mutationFailureResponse = (errors: Readonly<GraphQLError[] | undefined>): UserMutationResponse => {
  return failureResponse(
    errors
      ?.map(({ message }) => message)
      .filter((message) => message)
      .join(' ') ?? 'The was an unknown error'
  );
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private signUpMutation: SignUpGQL,
    private invitationQuery: InvitationGQL,
    private requestResetPasswordMutation: RequestResetPasswordGQL,
    private verifyResetPasswordTokenMutation: VerifyResetPasswordTokenGQL,
    private resetPasswordMutation: ResetPasswordGQL
  ) {}

  signUp$(key: string, password: string, firstName: string, lastName: string): Observable<UserMutationResponse> {
    return this.signUpMutation.mutate({ key, password, firstName, lastName }).pipe(
      map(({ data, errors }) => data?.signUp ?? mutationFailureResponse(errors)),
      catchError(() => of(serverFailureResponse))
    );
  }

  invitation$(key: string): Observable<InvitationType | null> {
    // Set 'no-cache' to prevent multiple submission of sign up form
    return this.invitationQuery
      .fetch({ key }, { fetchPolicy: 'no-cache' })
      .pipe(map((res) => res.data?.invitation ?? null));
  }

  requestResetPassword$(email: string): Observable<UserMutationResponse> {
    return this.requestResetPasswordMutation.mutate({ email }).pipe(
      map(({ data, errors }) => data?.requestResetPassword ?? mutationFailureResponse(errors)),
      catchError(() => of(serverFailureResponse))
    );
  }

  resetPassword$(
    uid: string,
    token: string,
    password: string,
    confirmPassword: string
  ): Observable<UserMutationResponse> {
    return this.resetPasswordMutation.mutate({ uid, token, password, confirmPassword }).pipe(
      map(({ data, errors }) => data?.resetPassword ?? mutationFailureResponse(errors)),
      catchError(() => of(serverFailureResponse))
    );
  }

  verifyResetPasswordToken$(uid: string, token: string): Observable<boolean> {
    return this.verifyResetPasswordTokenMutation
      .mutate({ token, uid })
      .pipe(map((res) => res.data?.verifyResetPasswordToken ?? false));
  }
}
