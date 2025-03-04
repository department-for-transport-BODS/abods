import { Component, OnInit } from "@angular/core";
import { initAll } from "govuk-frontend";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
import { NavService } from "./nav.service";
import { ConfigService } from "../../config/config.service";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { LoginInfo } from "../../../generated/graphql";

@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.scss"],
})
export class NavComponent implements OnInit {
  loginInfo: LoginInfo | null = null;

  constructor(
    public navService: NavService,
    private helpdeskPanelService: HelpdeskPanelService,
    public configService: ConfigService,
    private authUserService: AuthenticatedUserService,
  ) {}

  ngOnInit(): void {
    initAll();
    this.authUserService.authenticatedUser$.subscribe((loginInfo) => {
      this.loginInfo = loginInfo;
    });
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
