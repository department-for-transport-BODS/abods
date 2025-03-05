import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgxSmartModalService } from "ngx-smart-modal";
import { Subscription } from "rxjs";
import { UserFragment } from "src/generated/graphql";
import { OrganisationService } from "../organisation.service";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit, OnDestroy {
  submitted = false;

  subs: Subscription[] = [];

  loaded = false;
  errored = false;

  users: UserFragment[] = [];

  constructor(
    private service: OrganisationService,
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
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub?.unsubscribe());
  }

  openModal(): void {
    this.ngxSmartModalService.getModal("inviteUser").open();
  }
}
