import { NgModule, inject, provideAppInitializer } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { PercentPipe, ViewportScroller } from "@angular/common";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Event, EventType, Router, Scroll } from "@angular/router";
import { filter, pairwise } from "rxjs/operators";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AuthenticationModule } from "./authentication/authentication.module";
import { ConfigService } from "./config/config.service";
import { GraphQLModule } from "./graphql.module";
import { LayoutModule } from "./layout/layout.module";
import { SharedModule } from "./shared/shared.module";

import { GoogleTagManagerModule } from "angular-google-tag-manager";
import { CookieService } from "ngx-cookie-service";
import { MAPBOX_API_KEY, NgxMapboxGLModule } from "ngx-mapbox-gl";
import { AccessibilityModule } from "./accessibility/accessibility.module";
import { CookiePolicyModule } from "./cookie-policy/cookie-policy.module";
import { NotAuthorisedComponent } from "./not-authorised/not-authorised.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { PrivacyPolicyModule } from "./privacy-policy/privacy-policy.module";

@NgModule({
  declarations: [AppComponent, NotFoundComponent, NotAuthorisedComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    SharedModule,
    LayoutModule,
    GraphQLModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AuthenticationModule,
    AppRoutingModule,
    NgxMapboxGLModule,
    GoogleTagManagerModule,
    PrivacyPolicyModule,
    CookiePolicyModule,
    AccessibilityModule,
  ],
  providers: [
    provideAppInitializer(() => {
      const initializerFn = (
        (config: ConfigService) => async () =>
          await config.loadConfig()
      )(inject(ConfigService));
      return initializerFn();
    }),
    {
      provide: MAPBOX_API_KEY,
      useFactory: (config: ConfigService) => config.mapboxToken,
      deps: [ConfigService],
    },
    {
      provide: "googleTagManagerId",
      useFactory: (config: ConfigService) => config.analyticsId,
      deps: [ConfigService],
    },
    PercentPipe,
    CookieService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {
  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller,
  ) {
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
        pairwise(),
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
            previous.routerEvent.type === EventType.NavigationEnd &&
            current.routerEvent.type === EventType.NavigationEnd &&
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
    return url.split("?")[0];
  }
}
