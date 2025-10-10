process.env.AWS_REGION = "eu-west-2";
process.env.QUICKSIGHT_ASSUME_ROLE_ARN =
  "arn:aws:iam::123456789012:role/test-role";
process.env.QUICKSIGHT_AWS_ACCOUNT_ID = "123456789012";

import {
  assumeRole,
  getDashboardUserType,
  getSessionTags,
  groupStrings,
} from "./aws";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import logger from "../logger";
import * as awsLib from "./aws";
import { GenerateEmbedUrlForAnonymousUserCommand } from "@aws-sdk/client-quicksight";
import { accountTypes } from "../resolvers/userFunctions";

jest.mock("@aws-sdk/client-sts", () => {
  return {
    STSClient: jest.fn(),
    AssumeRoleCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/client-quicksight", () => ({
  QuickSightClient: jest.fn(),
  GenerateEmbedUrlForAnonymousUserCommand: jest.fn(),
}));

jest.mock("../logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("assumeRole", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      AWS_REGION: "eu-west-2",
      QUICKSIGHT_ASSUME_ROLE_ARN: "arn:aws:iam::123456789012:role/test-role",
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns credentials when assume role succeeds", async () => {
    const mockSend = jest.fn().mockResolvedValue({
      Credentials: {
        AccessKeyId: "AKIA...",
        SecretAccessKey: "SECRET...",
        SessionToken: "TOKEN...",
      },
    });
    // Mock the STSClient constructor to return an object with send
    (STSClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    // Mock AssumeRoleCommand as a dummy function
    (AssumeRoleCommand as unknown as jest.Mock).mockImplementation(
      (args) => args as never,
    );

    const result = await assumeRole();

    expect(STSClient).toHaveBeenCalledWith({ region: "eu-west-2" });
    expect(AssumeRoleCommand).toHaveBeenCalledWith({
      RoleArn: "arn:aws:iam::123456789012:role/test-role",
      RoleSessionName: "MySession",
      DurationSeconds: 3600,
    });
    expect(result).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(
      "Assumed role successfully: arn:aws:iam::123456789012:role/test-role",
    );
  });

  it("throws error if Credentials are missing", async () => {
    const mockSend = jest.fn().mockResolvedValue({});
    (STSClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    await expect(assumeRole()).rejects.toThrow("Failed to assume role");
    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) as unknown },
      "Error assuming role:",
    );
  });

  it("throws and logs error if STSClient.send throws", async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error("AWS error"));
    (STSClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    await expect(assumeRole()).rejects.toThrow("AWS error");
    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) as unknown },
      "Error assuming role:",
    );
  });
});

describe("getDashboardUrl", () => {
  const OLD_ENV = process.env;
  const mockSessionTags = [{ Key: "k", Value: "v" }];
  const mockDashboardId = "dashboard-123";
  const mockRegion = "eu-west-2";
  const mockAccountId = "123456789012";
  const mockEmbedUrl = "https://quicksight.aws.amazon.com/embed/url";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      AWS_REGION: mockRegion,
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns EmbedUrl when QuickSight returns a URL", async () => {
    jest.spyOn(awsLib, "assumeRole").mockResolvedValue({
      AccessKeyId: "AKIA...",
      SecretAccessKey: "SECRET...",
      SessionToken: "TOKEN...",
    } as never);

    jest.spyOn(awsLib, "getQuicksightClient").mockReturnValue({
      send: jest.fn().mockResolvedValue({ EmbedUrl: mockEmbedUrl }),
    } as never);

    (
      GenerateEmbedUrlForAnonymousUserCommand as unknown as jest.Mock
    ).mockImplementation((args) => args as unknown);

    const result = await awsLib.getDashboardUrl(
      mockSessionTags,
      mockDashboardId,
    );

    expect(awsLib.assumeRole).toHaveBeenCalled();
    expect(awsLib.getQuicksightClient).toHaveBeenCalledWith({
      AccessKeyId: "AKIA...",
      SecretAccessKey: "SECRET...",
      SessionToken: "TOKEN...",
    });
    expect(GenerateEmbedUrlForAnonymousUserCommand).toHaveBeenCalledWith({
      AwsAccountId: mockAccountId,
      Namespace: "default",
      ExperienceConfiguration: {
        Dashboard: {
          InitialDashboardId: mockDashboardId,
        },
      },
      SessionLifetimeInMinutes: 600,
      AuthorizedResourceArns: [
        `arn:aws:quicksight:${mockRegion}:${mockAccountId}:dashboard/${mockDashboardId}`,
      ],
      SessionTags: mockSessionTags,
    });
    expect(result).toBe(mockEmbedUrl);
  });

  it("returns undefined and logs error if QuickSight send throws", async () => {
    (assumeRole as jest.Mock).mockResolvedValue({
      AccessKeyId: "AKIA...",
      SecretAccessKey: "SECRET...",
      SessionToken: "TOKEN...",
    });

    const mockSend = jest.fn().mockRejectedValue(new Error("QS error"));
    (awsLib.getQuicksightClient as jest.Mock).mockReturnValue({
      send: mockSend,
    });

    (
      GenerateEmbedUrlForAnonymousUserCommand as unknown as jest.Mock
    ).mockImplementation((args) => args as unknown);

    const result = await awsLib.getDashboardUrl(
      mockSessionTags,
      mockDashboardId,
    );

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) as unknown },
      "Error getting embedded url:",
    );
  });

  it("returns undefined and logs error if assumeRole throws", async () => {
    (assumeRole as jest.Mock).mockRejectedValue(new Error("AssumeRole error"));

    const result = await awsLib.getDashboardUrl(
      mockSessionTags,
      mockDashboardId,
    );

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) as unknown },
      "Error getting embedded url:",
    );
  });
});

describe("groupStrings", () => {
  it("returns a single group if all strings fit within max length", () => {
    const values = ["a", "b", "c"];
    const result = groupStrings(values, 10, ",");
    expect(result).toEqual(["a,b,c"]);
  });

  it("splits into multiple groups if combined length exceeds maxStringLength", () => {
    const values = ["abc", "def", "ghij", "klmno"];
    // maxStringLength = 7, so "abc,def" (7), "ghij" (4), "klmno" (5)
    const result = groupStrings(values, 7, ",");
    expect(result).toEqual(["abc,def", "ghij", "klmno"]);
  });

  it("throws if any single string is longer than maxStringLength", () => {
    const values = ["short", "thisisaverylongstring"];
    expect(() => groupStrings(values, 10, ",")).toThrow(
      "A single string length is greater than the max group length",
    );
  });

  it("handles empty input", () => {
    expect(groupStrings([], 10, ",")).toEqual([]);
  });

  it("uses custom delimiter", () => {
    const values = ["a", "b", "c"];
    const result = groupStrings(values, 5, "|");
    expect(result).toEqual(["a|b|c"]);
  });

  it("handles exact boundary conditions", () => {
    const values = ["ab", "cd"];
    // "ab,cd" is length 5, which is maxStringLength
    expect(groupStrings(values, 5, ",")).toEqual(["ab,cd"]);
  });
});

describe("getSessionTags", () => {
  it("returns wildcard org tag for admin", () => {
    const result = getSessionTags(true, ["LTA1"], ["Org1"]);
    expect(result).toEqual([{ Key: "org0", Value: "*" }]);
  });

  it("returns correct tags for LTAs and orgs", () => {
    const result = getSessionTags(false, ["LTA1", "LTA2"], ["Org1", "Org2"]);
    expect(result).toEqual([
      { Key: "lta0", Value: "LTA1,LTA2" },
      { Key: "org0", Value: "Org1,Org2" },
    ]);
  });

  it("splits tags if groupStrings would split due to length", () => {
    // Each string is 250 chars, so groupStrings will split them
    const longName = "A".repeat(250);
    const result = getSessionTags(
      false,
      [longName, longName],
      [longName, longName],
    );
    expect(result).toEqual([
      { Key: "lta0", Value: `${longName}` },
      { Key: "lta1", Value: `${longName}` },
      { Key: "org0", Value: `${longName}` },
      { Key: "org1", Value: `${longName}` },
    ]);
  });

  it("throws if more than 7 LTA groups", () => {
    const ltas: string[] = Array(8).fill("LTA".repeat(80)) as string[];
    expect(() => getSessionTags(false, ltas, ["Org"])).toThrow(
      "Too many LTAs mapped to the user",
    );
  });

  it("throws if more than 7 org groups", () => {
    const orgs: string[] = Array(8).fill("Org".repeat(80)) as string[];
    expect(() => getSessionTags(false, ["LTA"], orgs)).toThrow(
      "Too many orgs mapped to the user",
    );
  });

  it("returns empty array if no LTAs or orgs and not admin", () => {
    expect(getSessionTags(false, [], [])).toEqual([]);
  });
});

describe("getDashboardUserType", () => {
  it("returns SuperAdmin if any user is superuser and admin", () => {
    const userDetails = [
      {
        is_superuser: true,
        account_type: accountTypes.admin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.SuperAdmin,
    );
  });

  it("returns Admin if any user is superuser but not admin", () => {
    const userDetails = [
      {
        is_superuser: true,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.Admin,
    );
  });

  it("returns LTA if any user has lta_name set and is not superuser", () => {
    const userDetails = [
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: "LTA1",
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.LTA,
    );
  });

  it("returns Operator if no user is superuser or LTA", () => {
    const userDetails = [
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.Operator,
    );
  });

  it("returns SuperAdmin if multiple users and at least one is superuser and admin", () => {
    const userDetails = [
      {
        is_superuser: false,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: true,
        account_type: accountTypes.admin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: true,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.SuperAdmin,
    );
  });

  it("returns Admin if multiple users and at least one is superuser (but none are admin)", () => {
    const userDetails = [
      {
        is_superuser: false,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: true,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.Admin,
    );
  });

  it("returns LTA if multiple users and at least one has lta_name", () => {
    const userDetails = [
      {
        is_superuser: false,
        account_type: accountTypes.orgAdmin,
        lta_name: null,
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: "LTA2",
        org_name: null,
      },
      {
        is_superuser: false,
        account_type: accountTypes.orgStaff,
        lta_name: null,
        org_name: null,
      },
    ];
    expect(getDashboardUserType(userDetails)).toBe(
      awsLib.DataDashboardUserType.LTA,
    );
  });

  it("returns Operator for empty userDetails", () => {
    expect(getDashboardUserType([])).toBe(
      awsLib.DataDashboardUserType.Operator,
    );
  });
});
