import { AlertTypeEnum } from '../src/types/generated';

const mockUserRecord = {
  id: 1234,
  email: 'john.doe@example.com',
  username: 'johndoe',
  first_name: 'John',
  last_name: 'Doe',
  orgIds: [123]
};
jest.mock('../src/resolvers/helpers', () => {
  return {
    __esModule: true,
    requireUserSession: () => Promise.resolve(mockUserRecord)
  };
});

import { getUser, getUserAlerts, getUsers } from '../src/resolvers/userFunctions.js';

describe('User functionality testing', () => {
  test('should return multiple users', async () => {
    const testDbUsers = [
      {
        id: '1234',
        email: 'john.doe@example.com',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        organisation_id: '1234'
      },
      {
        id: '4321',
        email: 'jane.doe@example.com',
        username: 'janedoe',
        first_name: 'Jane',
        last_name: 'Doe',
        organisation_id: '4321'
      }
    ];

    const testOutputUsers = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        id: '1234',
        lastName: 'Doe',
        organisation: {
          id: '123',
          name: '123'
        },
        roles: [
          {
            id: '1',
            name: 'Staff',
            scope: 'organisation'
          }
        ],
        username: 'johndoe'
      },
      {
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        id: '4321',
        lastName: 'Doe',
        organisation: {
          id: '123',
          name: '123'
        },
        roles: [
          {
            id: '1',
            name: 'Staff',
            scope: 'organisation'
          }
        ],
        username: 'janedoe'
      }
    ];

    const db = { bods_user: { findMany: jest.fn() } };

    db.bods_user.findMany.mockResolvedValue(testDbUsers);
    await expect((getUsers as any)({}, {}, { db })).resolves.toEqual(testOutputUsers);
    expect(db.bods_user.findMany).toBeCalledTimes(1);
    expect(db.bods_user.findMany.mock.calls[0][0].where.userOrganisations.every.organisation_id.in).toEqual(mockUserRecord.orgIds);
  });
  test('should return user by id', async () => {
    const outputUser = {
      id: mockUserRecord.id.toString(),
      username: mockUserRecord.username,
      email: mockUserRecord.email,
      firstName: mockUserRecord.first_name,
      lastName: mockUserRecord.last_name,
      roles: [
        {
          'id': '1',
          'name': 'Staff',
          'scope': 'organisation'
        },
        {
          'id': '2',
          'name': 'Administrator',
          'scope': 'organisation'
        }
      ]
    };

    await expect((getUser as any)({}, {}, {})).resolves.toEqual(outputUser);
  });

  test('get users alerts', async () => {
    const testDbAlerts = [{
      id: '1234',
      alert: 'FeedComplianceFailure',
      event_hysterisis: 10,
      event_threshold: 20,
      created_by_user: mockUserRecord,
      send_to_user: mockUserRecord
    }];
    const testOutputAlerts = [{
      alertId: '1234',
      alertType: AlertTypeEnum.FeedComplianceFailure,
      eventHysterisis: 10,
      eventThreshold: 20,
      createdBy: {
        id: mockUserRecord.id.toString(),
        username: mockUserRecord.username,
        email: mockUserRecord.email,
        firstName: mockUserRecord.first_name,
        lastName: mockUserRecord.last_name,
        roles: []
      },
      sendTo: {
        id: mockUserRecord.id.toString(),
        username: mockUserRecord.username,
        email: mockUserRecord.email,
        firstName: mockUserRecord.first_name,
        lastName: mockUserRecord.last_name,
        roles: []
      }
    }];

    const db = { alert: { findMany: jest.fn() } };
    db.alert.findMany.mockResolvedValue(testDbAlerts);
    await expect((getUserAlerts as any)({}, {}, { db })).resolves.toEqual(testOutputAlerts);
  });
});
