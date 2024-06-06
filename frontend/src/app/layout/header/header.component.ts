import { Component, Input } from '@angular/core';
import { AuthenticationService } from '../../authentication/authentication.service';
import { HelpdeskPanelService } from '../../shared/components/helpdesk-panel/helpdesk-panel.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() service?: string;

  constructor(private authService: AuthenticationService, private helpdeskPanelService: HelpdeskPanelService) {}

  hasSession() {
    return this.authService.isSessionAlive;
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
