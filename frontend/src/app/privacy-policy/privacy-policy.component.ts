import { Component } from "@angular/core";
import { LoggedInService } from "../authentication/loggedIn.service";

@Component({
  selector: "app-privacy-policy",
  templateUrl: "./privacy-policy.component.html",
  styleUrls: ["./privacy-policy.component.scss"],
})
export class PrivacyPolicyComponent {
  constructor(public loggedInService: LoggedInService) {}
}
