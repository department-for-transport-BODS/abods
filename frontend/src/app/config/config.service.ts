import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { SessionService } from "../authentication/session.service";
import { ConfigData, ConfigGQL } from "../../generated/graphql";

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

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  // Will be set in loadConfig at startup
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private config: ConfigData = null!;

  constructor(
    private session: SessionService,
    private query: ConfigGQL,
  ) {}

  loadConfig() {
    if (this.config) {
      return Promise.resolve();
    }

    if (!this.session.isSessionAlive()) {
      console.log("User is not authenticated, can't get config data");
      return;
    }

    return firstValueFrom(
      this.query.fetch().pipe(
        map((result) => {
          this.config = result.data.config;
          console.log("Environment: " + this.config.envName);
        }),
      ),
    );
  }

  flag(key: keyof ReturnType<typeof flags>): boolean {
    return flags(this.config.envName || "unknown")[key];
  }

  get data() {
    return this.config;
  }
}
