import { Injectable } from "@angular/core";
import { AuthenticatedUserService } from "./authenticated-user.service";

@Injectable({
  providedIn: "root",
})
export class LoggedInService {
  public authenticated = false;
  constructor(userService: AuthenticatedUserService) {
    userService.isAuthenticated$.subscribe((n) => (this.authenticated = n));
  }
}
