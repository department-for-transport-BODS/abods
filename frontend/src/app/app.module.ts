import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GraphQLModule } from './graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layout/layout.module';
import { ConfigService } from './config/config.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationModule } from './authentication/authentication.module';
import { PercentPipe, ViewportScroller } from '@angular/common';
import { Event, Router, Scroll } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';
import { UserModule } from './user/user.module';

import { NotFoundComponent } from './not-found/not-found.component';
import { NotAuthorisedComponent } from './not-authorised/not-authorised.component';
import { MAPBOX_API_KEY, NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';
import { PrivacyPolicyModule } from './privacy-policy/privacy-policy.module';
import { CookiePolicyModule } from './cookie-policy/cookie-policy.module';
import { CookieService } from 'ngx-cookie-service';

@NgModule({
  declarations: [AppComponent, NotFoundComponent, NotAuthorisedComponent],
  imports: [
    BrowserModule,
    SharedModule,
    LayoutModule,
    GraphQLModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AuthenticationModule,
    UserModule,
    AppRoutingModule,
    NgxMapboxGLModule,
    GoogleTagManagerModule,
    PrivacyPolicyModule,
    CookiePolicyModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (config: ConfigService) => async () => await config.loadConfig(),
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: MAPBOX_API_KEY,
      useFactory: (config: ConfigService) => config.mapboxToken,
      deps: [ConfigService],
    },
    {
      provide: 'googleTagManagerId',
      useFactory: (config: ConfigService) => config.analyticsId,
      deps: [ConfigService],
    },
    PercentPipe,
    CookieService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private router: Router, private viewportScroller: ViewportScroller) {
    this.handleScrollOnNavigation();
  }

  /**
   * When route is changed, Angular interprets a simple query params change as "forward navigation" too.
   * Using the pairwise function allows us to have both the previous and current router events, which we can
   * use to effectively compare the two navigation events and see if they actually change route, or only
   * the route parameters (i.e. selections stored in query params).
   *
   * Related to: https://github.com/angular/angular/issues/26744
   * TODO why is this needed? this should be initialized elsewhere.
   */
  private handleScrollOnNavigation(): void {
    this.router.events
      .pipe(
        filter((e: Event): e is Scroll => e instanceof Scroll),
        pairwise()
      )
      .subscribe((e: Scroll[]) => {
        const previous = e[0];
        const current = e[1];
        if (current.position) {
          // Backward navigation
          this.viewportScroller.scrollToPosition(current.position);
        } else if (current.anchor) {
          // Anchor navigation
          this.viewportScroller.scrollToAnchor(current.anchor);
        } else {
          // Check if routes match, or if it is only a query param change
          if (
            this.getBaseRoute(previous.routerEvent.urlAfterRedirects) !==
            this.getBaseRoute(current.routerEvent.urlAfterRedirects)
          ) {
            // Routes don't match, this is actual forward navigation
            // Default behavior: scroll to top
            this.viewportScroller.scrollToPosition([0, 0]);
          }
        }
      });
  }

  private getBaseRoute(url: string): string {
    // return url without query params
    return url.split('?')[0];
  }
}
