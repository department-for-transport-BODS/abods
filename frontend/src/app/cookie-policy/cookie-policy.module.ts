import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookiePolicyComponent } from './cookie-policy.component';
import { LayoutModule } from '../layout/layout.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [CookiePolicyComponent],
  imports: [CommonModule, LayoutModule, SharedModule, FormsModule, RouterModule],
  exports: [CookiePolicyComponent],
})
export class CookiePolicyModule {}
