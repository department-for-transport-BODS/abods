import { Component } from '@angular/core';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  constructor(private authenticationService: AuthenticationService) {}

  logout(): void {
    this.authenticationService.logout();
  }
}
