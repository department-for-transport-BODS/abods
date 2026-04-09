import { ConfigObject } from "@/types";

const REQUIRED_CONFIG_KEYS: (keyof ConfigObject)[] = [
  "apiUrl",
  "bodsBaseUrl",
  "envName",
  "analyticsId",
  "mapboxToken",
  "mapboxStyle",
  "mapboxSatelliteStyle",
  "vehicleJourneys",
  "otp",
  "defaultCookiePolicy",
  "freshdesk",
];

function validateConfig(
  config: Record<string, unknown>,
): asserts config is ConfigObject {
  const missing = REQUIRED_CONFIG_KEYS.filter(
    (key) => config[key] === undefined || config[key] === null,
  );
  if (missing.length > 0) {
    throw new Error(
      `config.json is missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
    );
  }
}

const configUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/config.json`;

export const fetchConfig = async (): Promise<ConfigObject> => {
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load config.json");
  }
  const config = (await response.json()) as Record<string, unknown>;
  validateConfig(config);
  return config;
};

export const getEnvName = (config: ConfigObject | null): string =>
  config?.envName ?? "unknown";
