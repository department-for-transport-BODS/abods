import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ForgottenPasswordComponent } from './forgotten-password/forgotten-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
  { path: 'invitations/accept-invite/:key', component: SignupComponent },
  { path: 'forgot-password', component: ForgottenPasswordComponent },
  { path: 'reset-password/:uid/:key', component: ResetPasswordComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
