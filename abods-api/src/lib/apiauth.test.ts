import { jest } from "@jest/globals";
import * as api from "./apiauth";

describe("requireApiToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(api, "hashApiKey").mockImplementation(() => "hashed-token");
  });

  it("returns not authenticated if apiKeyAuth is missing", () => {
    const context = { apiKeyAuth: undefined, headers: {} };
    const result = api.requireApiToken(context as never);
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/Authentication required/);
  });

  it("returns not authenticated if Authorization header is missing", () => {
    const context = {
      apiKeyAuth: { allowedTokenHash: "hash", Hmac: "hmac" },
      headers: {},
    };
    const result = api.requireApiToken(context as never);
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/Authorization Header is missing/);
  });

  it("returns not authenticated if token is missing in header", () => {
    const context = {
      apiKeyAuth: { allowedTokenHash: "hash", Hmac: "hmac" },
      headers: { Authorization: "Bearer " },
    };
    const result = api.requireApiToken(context as never);
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/API token is required/);
  });

  it("returns authenticated if token is valid", () => {
    const context = {
      apiKeyAuth: { allowedTokenHash: "hashed-token", Hmac: "hmac-secret" },
      headers: { Authorization: "Bearer valid-token" },
    };

    const result = api.requireApiToken(context as never);

    expect(api.hashApiKey).toHaveBeenCalledWith("valid-token", "hmac-secret");
    expect(result.isAuthenticated).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("returns not authenticated if token is invalid", () => {
    const context = {
      apiKeyAuth: { allowedTokenHash: "hashed-token", Hmac: "hmac-secret" },
      headers: { Authorization: "Bearer invalid-token" },
    };
    jest
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      .spyOn(api, "hashApiKey")
      .mockImplementation(() => "wrong-hash");

    const result = api.requireApiToken(context as never);
    expect(api.hashApiKey).toHaveBeenCalledWith("invalid-token", "hmac-secret");
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/Invalid API token/);
  });

  it("returns not authenticated if hashApiKey throws", () => {
    const context = {
      apiKeyAuth: { allowedTokenHash: "hashed-token", Hmac: "hmac-secret" },
      headers: { Authorization: "Bearer valid-token" },
    };
    (api.hashApiKey as jest.Mock).mockImplementation(() => {
      throw new Error("Hash error");
    });

    const result = api.requireApiToken(context as never);
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/Error validating API token/);
  });
});
