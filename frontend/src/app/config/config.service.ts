import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { merge } from 'lodash-es';

export interface ConfigObject {
  apiUrl: string;
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
  providedIn: 'root',
})
export class ConfigService {
  private config?: ConfigObject;

  constructor(private http: HttpClient) {}

  get apiUrl(): string {
    return this.loadStringValue('apiUrl', '');
  }

  get analyticsId(): string {
    return this.loadStringValue('analyticsId', '');
  }

  get mapboxToken(): string {
    return this.loadStringValue('mapboxToken', '');
  }

  get mapboxStyle() {
    return this.loadStringValue('mapboxStyle', '');
  }

  get mapboxSatelliteStyle() {
    return this.loadStringValue('mapboxSatelliteStyle', '');
  }

  get vehicleJourneys(): VehicleJourneysConfig {
    const defaults: VehicleJourneysConfig = {
      validDateRange: {
        offsetISO: 'PT0H',
        durationISO: 'P6M',
      },
    };
    return this.loadValue(() => {
      const config = (this.fetchValue('vehicleJourneys') || {}) as VehicleJourneysConfig;
      return merge(defaults, config);
    }, defaults);
  }

  get otp(): OtpConfig {
    const defaults: OtpConfig = {
      late: 6,
      early: 1,
    };
    return this.loadValue(() => {
      const config = (this.fetchValue('otp') || {}) as OtpConfig;
      return merge(defaults, config);
    }, defaults);
  }

  get defaultCookiePolicy(): CookiePolicy {
    const defaults: CookiePolicy = {
      analyticsEnabled: false,
      version: 1,
      userSubmitted: false,
    };
    return this.loadValue(() => {
      const config = (this.fetchValue('defaultCookiePolicy') || {}) as CookiePolicy;
      return merge(defaults, config);
    }, defaults);
  }

  get freshdeskConfig(): FreshdeskConfig {
    const defaults: FreshdeskConfig = {
      apiUrl: '',
      folders: {
        dashboard: '',
        feedMonitoring: '',
        otp: '',
        vehicleJourneys: '',
        corridors: '',
        organisation: '',
      },
    };
    return this.loadValue(() => {
      const config = (this.fetchValue('freshdesk') || {}) as FreshdeskConfig;
      return merge(defaults, config);
    }, defaults);
  }

  fetchValue(k: keyof ConfigObject): ConfigObject[keyof ConfigObject] {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    if (this.config[k] === undefined) {
      throw new Error(`${k} not defined in config.json`);
    }
    return this.config[k];
  }

  loadConfig() {
    return firstValueFrom(this.http.get('./config.json').pipe(map((config) => (this.config = config as ConfigObject))));
  }

  loadStringValue(propName: keyof ConfigObject, defaultValue: string): string {
    return this.loadValue(() => this.fetchValue(propName) as string, defaultValue);
  }

  loadValue<T>(getValue: () => T, defaultValue: T): T {
    try {
      return getValue();
    } catch {
      return defaultValue;
    }
  }
}
