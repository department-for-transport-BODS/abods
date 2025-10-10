import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { RequestContext } from "../types/extra";
import { createRequest, createResponse } from "node-mocks-http";
import * as helpers from "./helpers";

jest
  .spyOn(helpers, "throwUnauthenticatedError")
  .mockImplementation((message?: string, _?: string | number) => {
    throw new Error(message ?? "Unauthorized");
  });

let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;

beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    db: mockDb,
    req: createRequest(),
    res: createResponse(),
    headers: { cookie: "abods_sessionid=valid-session" },
    kysely: {} as never,
  };
});

describe("requireUserSession", () => {
  it("returns session user for valid session and active user", async () => {
    // Mock tokens.findFirst to return a valid session
    mockDb.tokens.findFirst.mockResolvedValue({
      token: "valid-session",
      user_id: 123,
      expires: new Date(Date.now() + 10000),
    } as never);

    // Mock bods_user.findUnique to return an active user with orgs
    mockDb.bods_user.findUnique.mockResolvedValue({
      is_active: true,
      userOrganisations: [
        {
          organisation_id: 10,
          organisation: { is_abods_global_viewer: true, name: "Org A" },
        },
      ],
    } as never);

    const sessionUser = await helpers.requireUserSession(context);

    expect(sessionUser).toEqual({
      id: 123,
      orgs: [{ id: 10, name: "Org A" }],
      isGlobalUser: true,
    });
  });

  it("throws if cookie header is missing", async () => {
    context.headers = {};
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws if sessionId is missing in cookie", async () => {
    context.headers = { cookie: "other_cookie=abc" };
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws if session record not found", async () => {
    mockDb.tokens.findFirst.mockResolvedValue(null);
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws if bods user not found", async () => {
    mockDb.tokens.findFirst.mockResolvedValue({
      token: "valid-session",
      user_id: 123,
      expires: new Date(Date.now() + 10000),
    } as never);
    mockDb.bods_user.findUnique.mockResolvedValue(null);
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws if user is not active", async () => {
    mockDb.tokens.findFirst.mockResolvedValue({
      token: "valid-session",
      user_id: 123,
      expires: new Date(Date.now() + 10000),
    } as never);
    mockDb.bods_user.findUnique.mockResolvedValue({
      is_active: false,
      userOrganisations: [
        {
          organisation_id: 10,
          organisation: { is_abods_global_viewer: true, name: "Org A" },
        },
      ],
    } as never);
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("throws if user not mapped to any organisation", async () => {
    mockDb.tokens.findFirst.mockResolvedValue({
      token: "valid-session",
      user_id: 123,
      expires: new Date(Date.now() + 10000),
    } as never);
    mockDb.bods_user.findUnique.mockResolvedValue({
      is_active: true,
      userOrganisations: [],
    } as never);
    await expect(helpers.requireUserSession(context)).rejects.toThrow(
      "User not mapped to any organisation",
    );
  });
});

describe("parseCookie", () => {
  it("parses a single cookie string", () => {
    const cookieStr = "abods_sessionid=abc123; theme=dark";
    const result = helpers.parseCookie(cookieStr);
    expect(result).toEqual({
      abods_sessionid: "abc123",
      theme: "dark",
    });
  });

  it("parses an array of cookie strings", () => {
    const cookieArr = ["abods_sessionid=abc123", "theme=dark"];
    const result = helpers.parseCookie(cookieArr);
    expect(result).toEqual({
      abods_sessionid: "abc123",
      theme: "dark",
    });
  });

  it("decodes URI components in cookie values", () => {
    const cookieStr = "name=John%20Doe; city=New%20York";
    const result = helpers.parseCookie(cookieStr);
    expect(result).toEqual({
      name: "John Doe",
      city: "New York",
    });
  });

  it("handles cookies with extra spaces", () => {
    const cookieStr = " abods_sessionid = abc123 ; theme = dark ";
    const result = helpers.parseCookie(cookieStr);
    expect(result).toEqual({
      abods_sessionid: "abc123",
      theme: "dark",
    });
  });

  it("returns empty object for empty string", () => {
    expect(helpers.parseCookie("")).toEqual({});
  });

  it("returns empty object for empty array", () => {
    expect(helpers.parseCookie([])).toEqual({});
  });
});
