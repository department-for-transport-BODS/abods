import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyPolicyComponent } from './privacy-policy.component';
import { LayoutModule } from '../layout/layout.module';

@NgModule({
  declarations: [PrivacyPolicyComponent],
  imports: [CommonModule, LayoutModule],
  exports: [PrivacyPolicyComponent],
})
export class PrivacyPolicyModule {}
