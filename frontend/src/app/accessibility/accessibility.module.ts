import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AccessibilityComponent } from "./accessibility.component";
import { LayoutModule } from "../layout/layout.module";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [AccessibilityComponent],
  imports: [CommonModule, LayoutModule, RouterModule],
})
export class AccessibilityModule {}
