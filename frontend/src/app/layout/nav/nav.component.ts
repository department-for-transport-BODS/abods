import { Component, OnInit } from "@angular/core";
import { initAll } from "govuk-frontend";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
import { NavService } from "./nav.service";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { map } from "rxjs/operators";
import { FeatureFlag, LoginInfo } from "../../../generated/graphql";

@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.scss"],
})
export class NavComponent implements OnInit {
  constructor(
    public navService: NavService,
    private helpdeskPanelService: HelpdeskPanelService,
    private authUserService: AuthenticatedUserService,
  ) {}
  hasFlag(info: LoginInfo, flag: FeatureFlag) {
    return info.flags.some((f) => f === flag);
  }
  canViewServiceMonitoring = this.authUserService.authenticatedUser$.pipe(
    map(
      (info) =>
        info.canViewServiceMonitoring &&
        this.hasFlag(info, FeatureFlag.ServiceMonitoring),
    ),
  );
  canViewStopAnalysis = this.authUserService.authenticatedUser$.pipe(
    map((info) => this.hasFlag(info, FeatureFlag.StopAnalysis)),
  );

  ngOnInit(): void {
    initAll();
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
