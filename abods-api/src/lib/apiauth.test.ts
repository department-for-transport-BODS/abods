import { jest } from "@jest/globals";
import * as api from "./apiauth";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import logger from "../logger";

describe("hashApiKey", () => {
  it("returns a base64-encoded HMAC-SHA256 hash", () => {
    const key = "my-api-key";
    const hmacSecret = "my-secret";
    const result = api.hashApiKey(key, hmacSecret);

    // Should be a base64 string
    expect(typeof result).toBe("string");
    // Should decode to 32 bytes (SHA256)
    const buffer = Buffer.from(result, "base64");
    expect(buffer.length).toBe(32);
  });

  it("throws if key is missing", () => {
    expect(() => api.hashApiKey("", "secret")).toThrow(
      "Key and HMAC secret are required",
    );
    expect(() => api.hashApiKey(undefined as never, "secret")).toThrow(
      "Key and HMAC secret are required",
    );
  });

  it("throws if hmacSecret is missing", () => {
    expect(() => api.hashApiKey("key", "")).toThrow(
      "Key and HMAC secret are required",
    );
    expect(() => api.hashApiKey("key", undefined as never)).toThrow(
      "Key and HMAC secret are required",
    );
  });

  it("produces different hashes for different keys or secrets", () => {
    const hash1 = api.hashApiKey("key1", "secret1");
    const hash2 = api.hashApiKey("key2", "secret1");
    const hash3 = api.hashApiKey("key1", "secret2");
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash2).not.toBe(hash3);
  });
});

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
    jest.spyOn(api, "hashApiKey").mockImplementationOnce(() => "wrong-hash");

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
    (api.hashApiKey as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Hash error");
    });

    const result = api.requireApiToken(context as never);
    expect(result.isAuthenticated).toBe(false);
    expect(result.message).toMatch(/Error validating API token/);
  });
});

describe("getClientHashFromAWS", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("throws if AWS_REGION or M2M_API_SECRET_NAME is missing", async () => {
    delete process.env.AWS_REGION;
    delete process.env.M2M_API_SECRET_NAME;
    await expect(api.getClientHashFromAWS()).rejects.toThrow(
      "API Token Auth Hash: AWS region and secret name are required",
    );
  });

  it("throws if SecretString is missing in AWS response", async () => {
    process.env.AWS_REGION = "eu-west-2";
    process.env.M2M_API_SECRET_NAME = "my-secret";
    const mockGetSecretValue = jest.fn().mockResolvedValue({} as never);
    jest
      .spyOn(SecretsManager.prototype, "getSecretValue")
      .mockImplementation(mockGetSecretValue);

    await expect(api.getClientHashFromAWS()).rejects.toThrow(
      "Token Hash Secret not found in AWS Secrets Manager",
    );
  });

  it("throws if required fields are missing in secret", async () => {
    process.env.AWS_REGION = "eu-west-2";
    process.env.M2M_API_SECRET_NAME = "my-secret";
    const secret = JSON.stringify({ Hmac: "hmac" }); // missing allowedTokenHash
    const mockGetSecretValue = jest
      .fn()
      .mockResolvedValue({ SecretString: secret } as never);
    jest
      .spyOn(SecretsManager.prototype, "getSecretValue")
      .mockImplementation(mockGetSecretValue);

    await expect(api.getClientHashFromAWS()).rejects.toThrow(
      "Invalid Secret Format in AWS Secrets Manager for Tokens",
    );
  });

  it("returns AuthContext when secret is valid", async () => {
    process.env.AWS_REGION = "eu-west-2";
    process.env.M2M_API_SECRET_NAME = "my-secret";
    const secret = JSON.stringify({
      allowedTokenHash: "hash",
      Hmac: "hmac",
    });
    const mockGetSecretValue = jest
      .fn()
      .mockResolvedValue({ SecretString: secret } as never);
    jest
      .spyOn(SecretsManager.prototype, "getSecretValue")
      .mockImplementation(mockGetSecretValue);

    const result = await api.getClientHashFromAWS();

    expect(result).toEqual({
      allowedTokenHash: "hash",
      Hmac: "hmac",
    });
  });
});

describe("getAPITokenHash", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the result from getClientHashFromAWS", async () => {
    const mockAuthContext = {
      allowedTokenHash: "mock-hash",
      Hmac: "mock-hmac",
    };
    const spy = jest
      .spyOn(api, "getClientHashFromAWS")
      .mockResolvedValue(mockAuthContext);

    const result = await api.getAPITokenHash();

    expect(result).toEqual(mockAuthContext);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns env values if M2M_API_KEY_HASH and M2M_API_KEY_HMAC are set", async () => {
    process.env.M2M_API_KEY_HASH = "env-hash";
    process.env.M2M_API_KEY_HMAC = "env-hmac";
    const warnSpy = jest.spyOn(logger, "warn").mockResolvedValue({} as never);

    const result = await api.getAPITokenHash();

    expect(result).toEqual({
      allowedTokenHash: "env-hash",
      Hmac: "env-hmac",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Using Client Token Hash and HMAC from M2M_API_KEY_HASH env var",
    );

    delete process.env.M2M_API_KEY_HASH;
    delete process.env.M2M_API_KEY_HMAC;
  });

  it("returns undefined and logs warning if getClientHashFromAWS throws", async () => {
    jest
      .spyOn(api, "getClientHashFromAWS")
      .mockRejectedValue(new Error("AWS error"));
    const warnSpy = jest.spyOn(logger, "warn").mockResolvedValue({} as never);

    const result = await api.getAPITokenHash();

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "API Token authentication is disabled: Failed to get API key hash",
      ),
    );
  });
});
