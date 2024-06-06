import { InjectionToken, NgModule } from '@angular/core';
import { ConfigService } from './config.service';

const API_URL = new InjectionToken<string>('ApiUrl');

@NgModule({
  providers: [
    {
      provide: API_URL,
      useFactory: (config: ConfigService) => {
        return config.apiUrl;
      },
      deps: [ConfigService],
    },
  ],
})
export class ConfigModule {}
