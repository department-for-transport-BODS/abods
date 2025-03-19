import { Component } from "@angular/core";
import { AuthenticationService } from "src/app/authentication/authentication.service";
import { NgxTippyService } from "ngx-tippy-wrapper";
import { NgxSmartModalService } from "ngx-smart-modal";

@Component({
  selector: "app-user-account",
  templateUrl: "./user-account.component.html",
  styleUrls: ["./user-account.component.scss"],
})
export class UserAccountComponent {
  constructor(
    private authService: AuthenticationService,
    public tippyService: NgxTippyService,
    private ngxSmartModalService: NgxSmartModalService,
  ) {}

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }

  openModal(): void {
    this.ngxSmartModalService.getModal("inviteUserFromNav").open();
  }
}
