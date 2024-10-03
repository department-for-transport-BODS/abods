import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UserFragment } from 'src/generated/graphql';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedUserService {
  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  private userSubject = new ReplaySubject<UserFragment | null>(1);
  private user: UserFragment | null = null;

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get authenticatedUser$(): Observable<UserFragment> {
    return this.userSubject.pipe(
      filter((u) => u !== null),
      map((u) => u as UserFragment)
    );
  }

  get authenticatedUserIsAdmin(): boolean {
    return this.user?.roles.some(({ name }) => name === 'Administrator') ?? false;
  }
  get authenticatedUserIsOrgUser(): boolean {
    return this.user?.roles.some(({ scope }) => scope === 'organisation') ?? false;
  }

  setUser(user: UserFragment | null) {
    this.user = user;
    this.userSubject.next(user);
  }

  authenticateUser() {
    this.isAuthenticatedSubject.next(true);
  }

  deauthenticateUser() {
    this.isAuthenticatedSubject.next(false);
  }
}
