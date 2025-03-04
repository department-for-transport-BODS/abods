import { Component, OnInit } from "@angular/core";
import { initAll } from "govuk-frontend";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
import { NavService } from "./nav.service";
import { ConfigService } from "../../config/config.service";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";

@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.scss"],
})
export class NavComponent implements OnInit {
  constructor(
    public navService: NavService,
    private helpdeskPanelService: HelpdeskPanelService,
    public configService: ConfigService,
    private authUserService: AuthenticatedUserService,
  ) {}

  ngOnInit(): void {
    initAll();
  }

  canViewServiceMonitoring() {
    return this.authUserService.canViewServiceMonitoring;
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
