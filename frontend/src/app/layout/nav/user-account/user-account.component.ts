import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { NgxTippyService } from 'ngx-tippy-wrapper';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
@Component({
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent {
  constructor(
    private authService: AuthenticationService,
    private authUserService: AuthenticatedUserService,
    public tippyService: NgxTippyService,
    private ngxSmartModalService: NgxSmartModalService
  ) {}

  get authenticatedUserIsAdmin(): boolean {
    return this.authUserService.authenticatedUserIsAdmin;
  }
  get authenticatedUserIsOrgUser(): boolean {
    return this.authUserService.authenticatedUserIsOrgUser;
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }

  openModal(): void {
    this.ngxSmartModalService.getModal('inviteUserFromNav').open();
  }
}
