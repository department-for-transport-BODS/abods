import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { merge } from "lodash-es";
import { AuthenticationService } from "../authentication/authentication.service";

export interface ConfigObject {
  envName: string;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle: string;
  vehicleJourneys: VehicleJourneysConfig;
  otp: OtpConfig;
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

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
  ) {
    // Will be set in loadConfig at startup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.config = null as ConfigObject;
  }

  loadConfig() {
    if (this.config) {
      return Promise.resolve();
    }

    if (!this.auth.isSessionAlive) {
      console.log("User is not authenticated, can't get config data");
      return;
    }

    console.log("GETTING AUTHENTICATED DATA");
    return firstValueFrom(
      this.http.get<ConfigObject>("./config.json").pipe(
        map((config) => {
          // TODO: validate that the shape of this response is correct
          console.log("GOT AUTHENTICATED DATA");
          this.config = config;
          console.log("Environment: " + this.config.envName);
        }),
      ),
    );
  }

  flag(key: keyof ReturnType<typeof flags>): boolean {
    return flags(this.config.envName || "unknown")[key];
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
