import * as config from "./environmentConfig.json";

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

export const EnvironmentConfig = config as {
  apiUrl: string;
  analyticsId: string;
  defaultCookiePolicy: CookiePolicy;
};
