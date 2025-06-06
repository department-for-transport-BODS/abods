import { Component, OnInit } from "@angular/core";
import { initAll } from "govuk-frontend";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
import { NavService } from "./nav.service";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { map } from "rxjs/operators";
import { FeatureFlag } from "../../../generated/graphql";
import { ConfigService } from "../../config/config.service";

@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.scss"],
  standalone: false,
})
export class NavComponent implements OnInit {
  constructor(
    public navService: NavService,
    private helpdeskPanelService: HelpdeskPanelService,
    private authUserService: AuthenticatedUserService,
    private config: ConfigService,
  ) {}

  canViewServiceMonitoring = this.authUserService.authenticatedUser$.pipe(
    map(
      (info) =>
        info.canViewServiceMonitoring &&
        this.config.hasFlag(info, FeatureFlag.ServiceMonitoring),
    ),
  );
  canViewDataMonitoring = this.authUserService.authenticatedUser$.pipe(
    map((info) => this.config.hasFlag(info, FeatureFlag.DataMonitoring)),
  );
  canViewStopAnalysis = this.authUserService.authenticatedUser$.pipe(
    map((info) => this.config.hasFlag(info, FeatureFlag.StopAnalysis)),
  );

  ngOnInit(): void {
    initAll();
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
