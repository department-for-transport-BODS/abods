import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { LogoutComponent } from './logout/logout.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '../layout/layout.module';
import { ApolloModule } from 'apollo-angular';

@NgModule({
  declarations: [LoginComponent, LogoutComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    CommonModule,
    SharedModule,
    RouterModule,
    LayoutModule,
    ApolloModule,
  ],
  exports: [LoginComponent, LogoutComponent],
})
export class AuthenticationModule {}
