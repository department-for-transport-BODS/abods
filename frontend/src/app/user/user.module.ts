import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupComponent } from './signup/signup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { ForgottenPasswordComponent } from './forgotten-password/forgotten-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { UserRoutingModule } from './user-routing.module';
import { LayoutModule } from '../layout/layout.module';

@NgModule({
  declarations: [SignupComponent, ForgottenPasswordComponent, ResetPasswordComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    CommonModule,
    SharedModule,
    RouterModule,
    UserRoutingModule,
    LayoutModule,
  ],
  exports: [SignupComponent],
})
export class UserModule {}
