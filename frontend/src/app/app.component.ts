import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AuthenticationService } from './authentication/authentication.service';
import { BrowserTitleService } from './shared/components/browser-title/browser-title.service';
import { Event, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PanelService } from './shared/components/panel/panel.service';
import { Observable } from 'rxjs';
import { VersionService } from './version/version.service';
import { AnalyticsService } from './shared/services/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  skipLinkContent?: string;
  skipLinkNav?: string;
  title = 'raa-client';
  service = 'Analyse Bus Open Data';

  constructor(
    private browserTitleService: BrowserTitleService,
    private router: Router,
    private authService: AuthenticationService,
    private panelService: PanelService,
    private versionService: VersionService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.versionService.printVersion();
    this.analyticsService.initialize();
  }

  ngAfterViewInit() {
    this.browserTitleService.applicationTitle = this.service;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((navEnd: Event) => {
      const route = (navEnd as NavigationEnd).urlAfterRedirects.split('#')[0];
      this.skipLinkContent = `${route}#content`;
      this.skipLinkNav = `${route}#navigation`;
    });
  }

  get showNav() {
    return this.authService.isSessionAlive;
  }

  get showPanel(): Observable<boolean> {
    return this.panelService.isOpen$;
  }
}
