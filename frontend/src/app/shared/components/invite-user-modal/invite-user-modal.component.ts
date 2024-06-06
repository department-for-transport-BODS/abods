import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { OrganisationService } from 'src/app/organisation/organisation.service';
import { RoleFragment, UserFragment } from 'src/generated/graphql';
import { FormErrors } from '../../gds/error-summary/error-summary.component';
import { PageHeaderBannerService } from 'src/app/layout/page-header/page-header-banner.service';

@Component({
  selector: 'app-invite-user-modal',
  templateUrl: './invite-user-modal.component.html',
  styleUrls: ['./invite-user-modal.component.scss'],
})
export class InviteUserModalComponent implements OnInit, OnDestroy {
  @Input() identifier!: string;
  inviteForm: FormGroup;
  errors: FormErrors[] = [];
  authenticatedUser: UserFragment | null = null;
  inviteSent = false;
  submitted = false;
  roles: RoleFragment[] = [];
  destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticatedUserService,
    public ngxSmartModalService: NgxSmartModalService,
    private pageHeaderBannerService: PageHeaderBannerService,
    private organisationService: OrganisationService
  ) {
    this.inviteForm = this.formBuilder.group({
      email: ['', { validators: [Validators.email, Validators.required], updateOn: 'blur' }],
      roleId: ['', [Validators.required]],
      organisationId: '',
    });
  }

  ngOnInit(): void {
    this.authService.authenticatedUser$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.authenticatedUser = u;
      this.inviteForm.patchValue({
        organisationId: this.authenticatedUser.organisation?.id ?? '',
      });
    });
    this.organisationService
      .listOrgRoles$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.roles = rs));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmitInvite() {
    this.errors = [];

    if (this.submitted) {
      return;
    }

    if (this.inviteForm?.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.submitted = true;

    this.organisationService
      .inviteUser$(this.inviteEmail, this.inviteRoleId, this.inviteOrganisationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((mures) => {
        if (mures.success) {
          this.pageHeaderBannerService.setBanner({
            title: 'Invite sent',
            id: 'invite-sent',
            message: `An invite has been sent to ${this.inviteEmail}`,
            dismissable: true,
            success: true,
            onDismiss: () => this.pageHeaderBannerService.clearBanner(),
          });

          this.submitted = false;
          this.inviteForm.patchValue({
            email: '',
            roleId: '',
          });
          this.inviteForm.markAsPristine();
          this.inviteForm.markAsUntouched();
          this.ngxSmartModalService.getModal(this.identifier).close();
        } else {
          console.warn('Error inviting user', mures.error);
          this.errors = [{ error: mures.error ?? 'There was an issue sending the invite' }];
          this.submitted = false;
        }
      });
  }

  hasError(prop: AbstractControl) {
    return prop.invalid && (prop.dirty || prop.touched);
  }

  getErrorString(prop: AbstractControl) {
    if (prop.errors?.required) {
      return 'This field is required.';
    }
    if (prop.errors?.email) {
      return 'Please enter a valid email address.';
    }
  }

  getError(controlName: string) {
    const prop = this.inviteForm?.get(controlName);
    if (prop && this.hasError(prop)) {
      return this.getErrorString(prop);
    }
  }

  get inviteEmail() {
    return this.inviteForm.get('email')?.value;
  }

  get inviteRoleId() {
    return this.inviteForm.get('roleId')?.value;
  }

  get inviteOrganisationId() {
    return this.inviteForm.get('organisationId')?.value;
  }
}
