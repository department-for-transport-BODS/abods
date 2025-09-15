import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { OrganisationService } from "./organisation.service";
import {
  ListUsersGQL,
  EditUserGQL,
  RemoveUserGQL,
  InviteUserGQL,
  ListUserAlertsGQL,
  FetchUserAlertGQL,
  UpdateUserAlertGQL,
  CreateUserAlertGQL,
  DeleteUserAlertGQL,
  AlertTypeEnum,
  AlertFragment,
} from "src/generated/graphql";
import { of } from "rxjs";

describe("OrganisationService", () => {
  let spectator: SpectatorService<OrganisationService>;
  let listUsers: jasmine.SpyObj<ListUsersGQL>;
  let editUser: jasmine.SpyObj<EditUserGQL>;
  let removeUser: jasmine.SpyObj<RemoveUserGQL>;
  let inviteUser: jasmine.SpyObj<InviteUserGQL>;
  let listUserAlerts: jasmine.SpyObj<ListUserAlertsGQL>;
  let fetchUserAlert: jasmine.SpyObj<FetchUserAlertGQL>;
  let updateUserAlert: jasmine.SpyObj<UpdateUserAlertGQL>;
  let createUserAlert: jasmine.SpyObj<CreateUserAlertGQL>;
  let deleteUserAlert: jasmine.SpyObj<DeleteUserAlertGQL>;

  const createService = createServiceFactory({
    service: OrganisationService,
    imports: [ApolloTestingModule],
    mocks: [
      ListUsersGQL,
      EditUserGQL,
      RemoveUserGQL,
      InviteUserGQL,
      ListUserAlertsGQL,
      FetchUserAlertGQL,
      UpdateUserAlertGQL,
      CreateUserAlertGQL,
      DeleteUserAlertGQL,
    ],
  });

  beforeEach(() => {
    spectator = createService();
    listUsers = spectator.inject(ListUsersGQL) as jasmine.SpyObj<ListUsersGQL>;
    editUser = spectator.inject(EditUserGQL) as jasmine.SpyObj<EditUserGQL>;
    removeUser = spectator.inject(
      RemoveUserGQL,
    ) as jasmine.SpyObj<RemoveUserGQL>;
    inviteUser = spectator.inject(
      InviteUserGQL,
    ) as jasmine.SpyObj<InviteUserGQL>;
    listUserAlerts = spectator.inject(
      ListUserAlertsGQL,
    ) as jasmine.SpyObj<ListUserAlertsGQL>;
    fetchUserAlert = spectator.inject(
      FetchUserAlertGQL,
    ) as jasmine.SpyObj<FetchUserAlertGQL>;
    updateUserAlert = spectator.inject(
      UpdateUserAlertGQL,
    ) as jasmine.SpyObj<UpdateUserAlertGQL>;
    createUserAlert = spectator.inject(
      CreateUserAlertGQL,
    ) as jasmine.SpyObj<CreateUserAlertGQL>;
    deleteUserAlert = spectator.inject(
      DeleteUserAlertGQL,
    ) as jasmine.SpyObj<DeleteUserAlertGQL>;
  });

  it("should create", () => {
    expect(spectator.service).toBeTruthy();
  });

  it("should fetch user by username", (done) => {
    const users = [
      { username: "alice", id: "1" },
      { username: "bob", id: "2" },
    ];
    listUsers.fetch.and.returnValue(
      of({
        data: { users },
        networkStatus: 7,
        loading: false,
        error: undefined,
      }),
    );

    spectator.service.fetchUser("bob").subscribe((user) => {
      expect(user).toEqual({ username: "bob", id: "2" });
      done();
    });
  });

  it("should list users", (done) => {
    const users = [
      { username: "alice", id: "1" },
      { username: "bob", id: "2" },
    ];
    listUsers.fetch.and.returnValue(
      of({
        data: { users },
        networkStatus: 7,
        loading: false,
        error: undefined,
      }),
    );

    spectator.service.listUsers$().subscribe((result) => {
      expect(result).toEqual(users);
      done();
    });
  });

  it("should edit user", (done) => {
    editUser.mutate.and.returnValue(
      of({
        data: {
          updateUser: {
            user: { username: "alice", id: "1" },
            error: null,
          },
        },
        errors: undefined,
      }),
    );

    spectator.service
      .editUser$("alice", "Alice", "Smith")
      .subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.error).toBeNull();
        done();
      });
  });

  it("should remove user", (done) => {
    removeUser.mutate.and.returnValue(
      of({
        data: {
          deleteUser: {
            success: true,
            error: null,
          },
        },
        errors: undefined,
      }),
    );

    spectator.service.removeUser$("alice").subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.error).toBeNull();
      done();
    });
  });

  it("should invite user", (done) => {
    inviteUser.mutate.and.returnValue(
      of({
        inviteUser: {
          invitation: {},
          error: null,
        },

        errors: undefined,
      }),
    );

    spectator.service
      .inviteUser$("test@email.com", "roleId", "orgId")
      .subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.error).toBeNull();
        done();
      });
  });

  it("should list user alerts", (done) => {
    const alerts: AlertFragment[] = [{ alertId: "1" }, { alertId: "2" }];
    listUserAlerts.watch.and.returnValue({
      valueChanges: of({ data: { userAlerts: alerts } }),
    } as any);

    spectator.service.listUserAlerts$().subscribe((result) => {
      expect(result).toEqual(alerts);
      done();
    });
  });

  it("should fetch user alert by id", (done) => {
    fetchUserAlert.fetch.and.returnValue(
      of({
        data: { userAlert: { alertId: "1" } },
        networkStatus: 7,
        loading: false,
        error: undefined,
      }),
    );

    spectator.service.fetchUserAlert$("1").subscribe((result) => {
      expect(result).toEqual({ alertId: "1" });
      done();
    });
  });

  it("should update user alert", (done) => {
    updateUserAlert.mutate.and.returnValue(
      of({
        data: {
          updateUserAlert: {
            success: true,
            error: null,
          },
        },
        errors: undefined,
      }),
    );

    spectator.service
      .updateUserAlert$("1", AlertTypeEnum.FeedAvailableEvent, "sendToId", 1, 2)
      .subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.error).toBeNull();
        done();
      });
  });

  it("should create user alert", (done) => {
    createUserAlert.mutate.and.returnValue(
      of({
        data: {
          addUserAlert: {
            success: true,
            error: null,
          },
        },
        errors: undefined,
      }),
    );

    spectator.service
      .createUserAlert$(AlertTypeEnum.FeedComplianceFailure, "sendToId", 1, 2)
      .subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.error).toBeNull();
        done();
      });
  });

  it("should delete user alert", (done) => {
    deleteUserAlert.mutate.and.returnValue(
      of({
        data: {
          deleteUserAlert: {
            success: true,
            error: null,
          },
        },
        errors: undefined,
      }),
    );

    spectator.service.deleteUserAlert$("1").subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.error).toBeNull();
      done();
    });
  });
});
