import { Component } from "@angular/core";
import { NgxTippyService } from "ngx-tippy-wrapper";
import { AuthenticationService } from "src/app/authentication/authentication.service";

@Component({
  selector: "app-user-account",
  templateUrl: "./user-account.component.html",
  styleUrls: ["./user-account.component.scss"],
  standalone: false,
})
export class UserAccountComponent {
  constructor(
    private authService: AuthenticationService,
    public tippyService: NgxTippyService,
  ) {}

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
