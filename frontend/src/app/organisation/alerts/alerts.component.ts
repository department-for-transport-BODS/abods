import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgxSmartModalComponent, NgxSmartModalService } from 'ngx-smart-modal';
import { Subscription } from 'rxjs';
import { AuthenticatedUserService } from 'src/app/authentication/authenticated-user.service';
import { UserFragment } from 'src/generated/graphql';
import { AlertViewModel } from '../models';
import { OrganisationService } from '../organisation.service';
import { EditAlertComponent } from './edit-alert/edit-alert.component';
@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
})
export class AlertsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(EditAlertComponent) editAlertComponent?: EditAlertComponent;

  subs: Subscription[] = [];

  alertsLoaded = false;
  alerts: AlertViewModel[] = [];

  editModal?: NgxSmartModalComponent;
  authenticatedUser?: UserFragment | null;

  modalEditing = false;

  constructor(
    public ngxSmartModalService: NgxSmartModalService,
    private service: OrganisationService,
    private authService: AuthenticatedUserService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.service.listUserAlerts$().subscribe((alerts) => {
        this.alerts = alerts.map((a) => new AlertViewModel(a));
        this.alertsLoaded = true;
      }),
      this.authService.authenticatedUser$.subscribe((user) => {
        this.authenticatedUser = user;
      })
    );
  }

  ngAfterViewInit(): void {
    this.editModal = this.ngxSmartModalService.getModal('editAlertModal');
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub?.unsubscribe());
  }

  createAlert() {
    this.editAlertComponent?.createAlert();
  }

  editAlert(alertId: string) {
    this.editAlertComponent?.editAlert(alertId);
  }

  openEditModal(editing: boolean) {
    this.modalEditing = editing;
    this.editModal?.open();
  }

  closeEditModal() {
    this.editModal?.close();
  }

  get authUserIsAdmin() {
    return this.authenticatedUser?.roles.some(({ name }) => name === 'Administrator') ?? false;
  }
}
