import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { merge } from "lodash-es";

export interface ConfigObject {
  envName: string;
  analyticsId: string;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle: string;
  vehicleJourneys: VehicleJourneysConfig;
  otp: OtpConfig;
  defaultCookiePolicy: CookiePolicy;
  freshdesk: FreshdeskConfig;
}

export interface VehicleJourneysConfig {
  validDateRange: {
    /**
     * Offset from current timestamp in ISO_8601 duration format
     * https://en.wikipedia.org/wiki/ISO_8601#Durations
     */
    offsetISO: string;
    /**
     * Duration for vehicle journey search in ISO_8601 duration format
     * https://en.wikipedia.org/wiki/ISO_8601#Durations
     */
    durationISO: string;
  };
}

export interface OtpConfig {
  early: number;
  late: number;
}

export interface CookiePolicy {
  /**
   * true = Google Analytics is enabled
   */
  analyticsEnabled: boolean;
  /**
   * Cookie policy version number
   */
  version: number;
  /**
   * true = user has submitted their preference and cookie banner is hidden
   */
  userSubmitted: boolean;
}

export interface FreshdeskFolderConfig {
  dashboard: string;
  feedMonitoring: string;
  otp: string;
  vehicleJourneys: string;
  corridors: string;
  organisation: string;
  [key: string]: string;
}

const environments = ["local", "sandbox", "dev", "test", "uat"] as const;
type Environment = (typeof environments)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maxEnvironment(current: string, max: Environment): boolean {
  const currentIndex = environments.indexOf(current as Environment);
  const maxIndex = environments.indexOf(max);
  if (currentIndex < 0 || maxIndex < 0) return false;

  return maxIndex >= currentIndex;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function flags(currentEnv: string) {
  // TODO: get from API
  return {} as const;
}

export interface FreshdeskConfig {
  /**
   * Endpoint to freshdesk proxy API
   */
  apiUrl: string;
  /**
   * Section to freshdesk folder id map
   */
  folders: FreshdeskFolderConfig;
}

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private config: ConfigObject;

  constructor(private http: HttpClient) {
    // Will be set in loadConfig at startup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.config = null as ConfigObject;
  }

  loadConfig() {
    return firstValueFrom(
      this.http.get<ConfigObject>("./config.json").pipe(
        map((config) => {
          // TODO: validate that the shape of this response is correct
          this.config = config;
        }),
      ),
    );
  }

  flag(key: keyof ReturnType<typeof flags>): boolean {
    return flags(this.envName)[key];
  }

  get envName(): string {
    return this.config.envName || "unknown";
  }

  get analyticsId(): string {
    return this.config.analyticsId || "";
  }

  get mapboxToken(): string {
    return this.config.mapboxToken || "";
  }

  get mapboxStyle() {
    return this.config.mapboxStyle || "";
  }

  get mapboxSatelliteStyle() {
    return this.config.mapboxSatelliteStyle || "";
  }

  get vehicleJourneys(): VehicleJourneysConfig {
    const defaults: VehicleJourneysConfig = {
      validDateRange: {
        offsetISO: "PT0H",
        durationISO: "P6M",
      },
    };
    return merge(defaults, this.config.vehicleJourneys || {});
  }

  get otp(): OtpConfig {
    const defaults: OtpConfig = {
      late: 6,
      early: 1,
    };
    return merge(defaults, this.config.otp || {});
  }

  get defaultCookiePolicy(): CookiePolicy {
    const defaults: CookiePolicy = {
      analyticsEnabled: false,
      version: 1,
      userSubmitted: false,
    };
    return merge(defaults, this.config.defaultCookiePolicy || {});
  }

  get freshdeskConfig(): FreshdeskConfig {
    const defaults: FreshdeskConfig = {
      apiUrl: "",
      folders: {
        dashboard: "",
        feedMonitoring: "",
        otp: "",
        vehicleJourneys: "",
        corridors: "",
        organisation: "",
      },
    };
    return merge(defaults, this.config.freshdesk || {});
  }
}

interface EnvironmentConfig {
  apiUrl: string;
}

@Injectable({ providedIn: "root" })
export class EnvironmentConfigService {
  private config = {} as EnvironmentConfig;
  constructor(private http: HttpClient) {}

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  loadConfig() {
    return firstValueFrom(
      this.http.get<EnvironmentConfig>("./config.json").pipe(
        map((data) => {
          // Some simple validation to ensure that we are actually getting back what we should be
          if (!data.apiUrl) {
            throw new Error("Could not read API URL");
          }
          this.config = data as EnvironmentConfig;
        }),
      ),
    );
  }
}
