import { Injectable } from '@angular/core';
import {
  AlertFragment,
  AlertTypeEnum,
  EditUserGQL,
  FetchUserAlertGQL,
  InviteUserGQL,
  ListRolesGQL,
  ListUserAlertsGQL,
  ListUsersGQL,
  RemoveUserGQL,
  RoleFragment,
  UserFragment,
  UpdateUserAlertGQL,
  ListUserAlertsDocument,
  CreateUserAlertGQL,
  DeleteUserAlertGQL,
} from 'src/generated/graphql';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { GraphQLError } from 'graphql';

interface MutationResponse<T> {
  error?: string | null;
  success: boolean;
  result?: T | null;
}

const failureResponse = <T>(error: string): MutationResponse<T> => ({ error, success: false });

const serverFailureResponse = <T>(): MutationResponse<T> =>
  failureResponse('There was an error communicating with the server, please try again.');

const mutationFailureResponse = <T>(errors: Readonly<GraphQLError[] | undefined>): MutationResponse<T> => {
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
export class OrganisationService {
  constructor(
    private listUsers: ListUsersGQL,
    private editUser: EditUserGQL,
    private removeUser: RemoveUserGQL,
    private inviteUser: InviteUserGQL,
    private listRoles: ListRolesGQL,
    private listUserAlerts: ListUserAlertsGQL,
    private fetchUserAlert: FetchUserAlertGQL,
    private updateUserAlert: UpdateUserAlertGQL,
    private createUserAlert: CreateUserAlertGQL,
    private deleteUserAlert: DeleteUserAlertGQL
  ) {}

  userListDirty = false;

  fetchUser(username: string): Observable<UserFragment | undefined> {
    return this.listUsers$().pipe(map((users) => users.find((user) => user.username === username)));
  }

  listUsers$(): Observable<UserFragment[]> {
    return this.listUsers.fetch({}, { fetchPolicy: this.userListDirty ? 'no-cache' : 'cache-first' }).pipe(
      tap(() => (this.userListDirty = false)),
      map((res) => res.data?.users ?? [])
    );
  }

  listOrgRoles$(): Observable<RoleFragment[]> {
    return this.listRoles
      .fetch()
      .pipe(map(({ data }) => data?.roles?.filter(({ scope }) => scope === 'organisation') ?? []));
  }

  editUser$(
    username: string,
    firstName: string,
    lastName: string,
    role: string
  ): Observable<MutationResponse<UserFragment>> {
    return this.editUser.mutate({ username, firstName, lastName, role }).pipe(
      tap(() => (this.userListDirty = true)),
      map(({ data, errors }) => {
        if (!data) {
          return mutationFailureResponse<UserFragment>(errors);
        }

        const { user, error } = data.updateUser;

        return {
          success: !data.updateUser.error,
          result: user,
          error,
        };
      }),
      catchError(() => of(serverFailureResponse<UserFragment>()))
    );
  }

  removeUser$(username: string): Observable<MutationResponse<void>> {
    return this.removeUser.mutate({ username }).pipe(
      tap(() => (this.userListDirty = true)),
      map(({ data, errors }) => {
        if (!data) {
          return mutationFailureResponse<void>(errors);
        }

        const { success, error } = data.deleteUser;

        return {
          success,
          error,
        };
      }),
      catchError(() => of(serverFailureResponse<void>()))
    );
  }

  inviteUser$(email: string, roleId: string, organisationId: string): Observable<MutationResponse<void>> {
    return this.inviteUser.mutate({ email, roleId, organisationId }).pipe(
      map(({ data, errors }) => {
        if (!data) {
          return mutationFailureResponse<void>(errors);
        }

        const { invitation, error } = data.inviteUser;

        return {
          success: !error && !!invitation,
          error,
        };
      }),
      catchError(() => of(serverFailureResponse<void>()))
    );
  }

  listUserAlerts$(): Observable<AlertFragment[]> {
    return this.listUserAlerts.watch().valueChanges.pipe(map((res) => res.data?.userAlerts ?? []));
  }

  fetchUserAlert$(alertId: string): Observable<AlertFragment | null> {
    return this.fetchUserAlert.fetch({ alertId }).pipe(map((res) => res.data?.userAlert ?? null));
  }

  updateUserAlert$(
    alertId: string,
    alertType: AlertTypeEnum,
    sendToId: string,
    eventHysterisis?: number,
    eventThreshold?: number
  ): Observable<MutationResponse<void>> {
    return this.updateUserAlert
      .mutate(
        { alertId, alertType, sendToId, eventHysterisis, eventThreshold },
        {
          refetchQueries: [{ query: ListUserAlertsDocument }],
        }
      )
      .pipe(
        map(({ data, errors }) => {
          if (!data) {
            return mutationFailureResponse<void>(errors);
          }

          return data.updateUserAlert;
        }),
        catchError(() => of(serverFailureResponse<void>()))
      );
  }

  createUserAlert$(
    alertType: AlertTypeEnum,
    sendToId: string,
    eventHysterisis?: number,
    eventThreshold?: number
  ): Observable<MutationResponse<void>> {
    return this.createUserAlert
      .mutate(
        { alertType, sendToId, eventHysterisis, eventThreshold },
        { refetchQueries: [{ query: ListUserAlertsDocument }] }
      )
      .pipe(
        map(({ data, errors }) => {
          if (!data) {
            return mutationFailureResponse<void>(errors);
          }

          return data.addUserAlert;
        }),
        catchError(() => of(serverFailureResponse<void>()))
      );
  }

  deleteUserAlert$(alertId: string): Observable<MutationResponse<void>> {
    return this.deleteUserAlert.mutate({ alertId }, { refetchQueries: [{ query: ListUserAlertsDocument }] }).pipe(
      map(({ data, errors }) => {
        if (!data) {
          return mutationFailureResponse<void>(errors);
        }

        return data.deleteUserAlert;
      }),
      catchError(() => of(serverFailureResponse<void>()))
    );
  }
}
