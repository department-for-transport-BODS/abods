import { Component, Input } from "@angular/core";
import { SessionService } from "../../authentication/session.service";
import { HelpdeskPanelService } from "../../shared/components/helpdesk-panel/helpdesk-panel.service";
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
  @Input() service?: string;

  constructor(
    private sessionService: SessionService,
    private helpdeskPanelService: HelpdeskPanelService,
  ) {}

  hasSession() {
    return this.sessionService.isSessionAlive();
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
