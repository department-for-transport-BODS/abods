import { Component, OnInit } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormErrors } from 'src/app/shared/gds/error-summary/error-summary.component';
import { OrganisationService } from '../organisation.service';
import { BehaviorSubject, combineLatest, Subject, Subscription } from 'rxjs';
import { RoleFragment, UserFragment } from 'src/generated/graphql';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent implements OnInit {
  userForm: FormGroup;
  loaded = false;
  errors: FormErrors[] = [];
  submitted = false;

  username = new BehaviorSubject<string | null>(null);
  userList = new BehaviorSubject<UserFragment[]>([]);

  orgRoles: RoleFragment[] = [];

  subs: Subscription[] = [];

  user = new Subject<UserFragment | null>();

  constructor(
    private formBuilder: FormBuilder,
    private service: OrganisationService,
    private route: ActivatedRoute,
    private router: Router,
    public ngxSmartModalService: NgxSmartModalService
  ) {
    this.userForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: [{ value: '', disabled: true }, Validators.required],
      role: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.subs.push(
      this.route.paramMap
        .pipe(
          filter((pM) => !!pM.get('email')),
          map((pM) => pM.get('email')),
          distinctUntilChanged()
        )
        .subscribe((e) => this.username.next(e)),
      this.service.listUsers$().subscribe((users) => this.userList.next(users)),
      this.service.listOrgRoles$().subscribe((orgRoles) => (this.orgRoles = orgRoles)),
      this.user.subscribe((user) => {
        if (user) {
          const { firstName, lastName, username, roles } = user;
          this.userForm.setValue({ firstName, lastName, username, role: roles[0].id });
        }
      }),
      combineLatest([this.username, this.userList])
        .pipe(map(([usernamet, userList]) => userList.find(({ username }) => usernamet === username) ?? null))
        .subscribe((u) => {
          this.user.next(u);
        })
    );
  }

  onSubmit() {
    this.errors = [];

    if (this.submitted) {
      return;
    }

    if (!this.username.value) {
      return;
    }

    if (this.userForm?.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitted = true;

    this.subs.push(
      this.service.editUser$(this.username.value, this.firstName, this.lastName, this.role).subscribe((mures) => {
        if (mures.success) {
          this.router.navigate(['/organisation/users/']);
        } else {
          console.warn('Edit user failed', mures.error);
          this.errors = [{ error: mures.error ?? 'There was an issue submitting the form' }];
          this.submitted = false;
        }
      })
    );
  }

  onClose() {
    this.router.navigate(['/organisation/users/']);
  }

  removeUser() {
    this.errors = [];

    if (this.submitted) {
      return;
    }

    if (!this.username.value) {
      return;
    }

    this.submitted = true;

    this.subs.push(
      this.service.removeUser$(this.username.value).subscribe((mures) => {
        if (mures.success) {
          this.router.navigate(['/organisation/users/']);
        } else {
          console.warn('Remove user failed', mures.error);
          this.errors = [{ error: mures.error ?? 'There was an issue deleting the user' }];
          this.submitted = false;
          this.ngxSmartModalService.getModal('removeUser').close();
        }
      })
    );
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(prop: AbstractControl) {
    if (prop.errors?.required) {
      return 'This field is required.';
    }
  }

  getError(controlName: string) {
    const prop = this.userForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }

  get firstName() {
    return this.userForm.get('firstName')?.value;
  }

  get lastName() {
    return this.userForm.get('lastName')?.value;
  }

  get role() {
    return this.userForm.get('role')?.value;
  }
}
