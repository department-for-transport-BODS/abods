import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgxSmartModalService } from "ngx-smart-modal";
import { Subscription } from "rxjs";
import { UserFragment } from "src/generated/graphql";
import { OrganisationService } from "../organisation.service";
import { AuthenticatedUserService } from "src/app/authentication/authenticated-user.service";
@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit, OnDestroy {
  submitted = false;

  inviteSent = false;

  subs: Subscription[] = [];

  loaded = false;
  errored = false;

  authenticatedUser: UserFragment | null = null;

  get authenticatedUserIsAdmin(): boolean {
    return this.authService.authenticatedUserIsAdmin;
  }

  users: UserFragment[] = [];

  constructor(
    private service: OrganisationService,
    private authService: AuthenticatedUserService,
    public ngxSmartModalService: NgxSmartModalService,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.service.listUsers$().subscribe((users) => {
        if (users) {
          this.users = users;
          this.loaded = true;
        } else {
          this.errored = true;
        }
      }),
      this.authService.authenticatedUser$.subscribe(
        (u) => (this.authenticatedUser = u),
      ),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub?.unsubscribe());
  }

  openModal(): void {
    this.ngxSmartModalService.getModal("inviteUser").open();
  }
}
