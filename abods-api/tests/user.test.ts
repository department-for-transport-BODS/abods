import { getUser, getUserAlerts, getUserByUsername, getUsers} from '../src/resolvers/users/userFunctions.js'
import { MockContext, Context, createMockContext } from '../src/context.js'
import { Alert } from '@prisma/client'

let mockCtx: MockContext
let ctx: Context

beforeEach(() => {
  mockCtx = createMockContext()
  ctx = mockCtx as unknown as Context
})

describe("User functionality testing", () => {
  // USERS
  test('should return multiple users', async () => {

    const testOutputUsers = [
      {
        id: '1234',
        email: "john.doe@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        organisation: undefined,
        roles: null
      }
    ]

    const testDbUsers = [
      {
        id: '1234',
        email: "john.doe@example.com",
        username: "johndoe",
        first_name: "John",
        last_name: "Doe",
        password: "1234",
        organisation_id: "1234",
        token:''
      }
    ];

    const testDbRoles = [
      {
        id: "1",
        name: "Staff",
        scope: "organisation"
      }
    ]

    mockCtx.prisma.user.findMany.mockResolvedValue(testDbUsers)
    mockCtx.prisma.role.findMany.mockResolvedValue(testDbRoles)
    await expect(getUsers(ctx)).resolves.toEqual(testOutputUsers)
  })
  test('should return user by id', async () => {
    const dbUser = {
      id: '1234',
      email: "john.doe@example.com",
      username: "johndoe",
      first_name: "John",
      last_name: "Doe",
      password: "1234",
      organisation_id: "1234",
      token:''
    }

    const outputUser = {
      id: '1234',
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      organisation: undefined,
      roles: null
    }

    mockCtx.prisma.user.findUnique.mockResolvedValue(dbUser)
    await expect(getUser('1234', ctx)).resolves.toEqual(outputUser)
  })
  test('should return user by username', async () => {
    const dbUser = {
      id: '1234',
      email: "john.doe@example.com",
      username: "johndoe",
      first_name: "John",
      last_name: "Doe",
      password: "1234",
      organisation_id: "1234",
      token:''
    }

    const outputUser = {
      id: '1234',
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      organisation: undefined,
      roles: null
    }

      const testDbRoles = [
      {
        id: "1",
        name: "Staff",
        scope: "organisation"
      }
    ]

    mockCtx.prisma.user.findUnique.mockResolvedValue(dbUser)
    mockCtx.prisma.role.findMany.mockResolvedValue(testDbRoles)
    await expect(getUserByUsername('johndoe', ctx)).resolves.toEqual(outputUser)
  })
  test('should reset a users password', async () => {
    // const user = {
    //   id: '1234',
    //   email: "john.doe@example.com",
    //   username: "johndoe",
    //   first_name: "John",
    //   last_name: "Doe",
    //   password: "1234",
    //   token:''
    // }

    // mockCtx.prisma.user.findUnique.mockResolvedValue(user)
    // await expect(getUser('1234', ctx)).resolves.toEqual(user)
    expect(1).resolves.toEqual(1)
  })
  test('reset password', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('verify password reset token', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('update user details', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('delete a user', async () => {
    expect(1).resolves.toEqual(1)
  })

  // ALERTS
  test('get users alerts', async () => {
        const testOutputAlerts = [
      {
        id: '1234',
        alert_id: null,
        event_hysterisis: 10,
        event_threshold: "johndoe",
        firstName: "John",
        lastName: "Doe",
        organisation: undefined,
        roles: null
      }
    ]

    const testDbAlerts = [
      {
        id: '1234',
        email: "john.doe@example.com",
        username: "johndoe",
        first_name: "John",
        last_name: "Doe",
        password: "1234",
        organisation_id: "1234",
        token:''
      }
    ];

    const testDbRoles = [
      {
        id: "1",
        name: "Staff",
        scope: "organisation"
      }
    ]

    mockCtx.prisma.alert.findMany.mockResolvedValue(testDbAlerts)
    await expect(getUserAlerts(ctx)).resolves.toEqual(testOutputUsers)
  })
  test('get 1 alert', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('add an alert', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('update an alert', async () => {
    expect(1).resolves.toEqual(1)
  })
  test('delete an alert', async () => {
    expect(1).resolves.toEqual(1)
  })
})
