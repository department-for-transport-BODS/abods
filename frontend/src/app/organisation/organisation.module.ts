import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from '../organisation/users/users.component';
import { LayoutModule } from '../layout/layout.module';
import { SharedModule } from '../shared/shared.module';
import { OrganisationRoutingModule } from './organisation-routing.module';
import { EditUserComponent } from './edit-user/edit-user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertsComponent } from './alerts/alerts.component';
import { EditAlertComponent } from './alerts/edit-alert/edit-alert.component';
import { UserNotFoundComponent } from './user-not-found/user-not-found.component';

@NgModule({
  declarations: [UsersComponent, EditUserComponent, AlertsComponent, EditAlertComponent, UserNotFoundComponent],
  imports: [CommonModule, LayoutModule, SharedModule, OrganisationRoutingModule, FormsModule, ReactiveFormsModule],
})
export class OrganisationModule {}
