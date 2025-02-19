import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrivacyPolicyComponent } from "./privacy-policy.component";
import { LayoutModule } from "../layout/layout.module";
import { RouterLink } from "@angular/router";

@NgModule({
  declarations: [PrivacyPolicyComponent],
  imports: [CommonModule, LayoutModule, RouterLink],
  exports: [PrivacyPolicyComponent],
})
export class PrivacyPolicyModule {}
