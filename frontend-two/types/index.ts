export interface ErrorInfo {
  id: string;
  errorMessage: string;
}

export interface ConfigObject {
  apiUrl: string;
  envName: string;
  analyticsId: string;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle: string;
  vehicleJourneys: {
    validDateRange: {
      offsetISO: string;
      durationISO: string;
    };
  };
  otp: {
    early: number;
    late: number;
  };
  defaultCookiePolicy: {
    analyticsEnabled: boolean;
    version: number;
    userSubmitted: boolean;
  };
  freshdesk: {
    apiUrl: string;
    folders: Record<string, string>;
  };
  supportEmail?: string;
}

export interface LoginInfo {
  currentUserId: string;
  canViewServiceMonitoring: boolean;
  canEditAllAlerts: boolean;
  canViewDistances: boolean;
  serviceMonitoringEmbedUrl?: string | null;
  flags: string[];
}

export interface User {
  username?: string;
}

export interface Session {
  expiresAt: string;
}
