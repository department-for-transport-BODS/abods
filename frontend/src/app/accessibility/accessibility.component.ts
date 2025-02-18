import { Component } from "@angular/core";
import { LoggedInService } from "../authentication/loggedIn.service";

@Component({
  selector: "app-accessibility",
  templateUrl: "./accessibility.component.html",
  styleUrls: ["./accessibility.component.scss"],
})
export class AccessibilityComponent {
  constructor(public loggedInService: LoggedInService) {}
}
