import { Injectable } from "@angular/core";
import { Observable, ReplaySubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { LoginInfo, LoginResponse } from "../../generated/graphql";

@Injectable({
  providedIn: "root",
})
export class AuthenticatedUserService {
  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  private userSubject = new ReplaySubject<LoginInfo | null>(1);
  private loginResponseSubject = new ReplaySubject<LoginResponse | null>(1);

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get authenticatedUser$(): Observable<LoginInfo> {
    return this.userSubject.pipe(
      filter((u) => u !== null),
      map((u) => u),
    );
  }

  get loginResponse$(): Observable<LoginResponse> {
    return this.loginResponseSubject.pipe(
      filter((r) => r !== null),
      map((r) => r),
    );
  }

  setUser(user: LoginInfo | null) {
    this.userSubject.next(user);
  }

  setLoginResponse(response: LoginResponse | null) {
    this.loginResponseSubject.next(response);
  }

  authenticateUser() {
    this.isAuthenticatedSubject.next(true);
  }

  deauthenticateUser() {
    this.isAuthenticatedSubject.next(false);
  }
}
