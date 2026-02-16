import { ConfigObject } from "@/types";

export const fetchConfig = async (): Promise<ConfigObject> => {
  const response = await fetch("/config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load config.json");
  }
  return (await response.json()) as ConfigObject;
};

export const getEnvName = (config: ConfigObject | null): string =>
  config?.envName ?? "unknown";
