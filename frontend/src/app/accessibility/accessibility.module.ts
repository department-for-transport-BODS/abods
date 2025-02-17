import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AccessibilityComponent } from "./accessibility.component";
import { LayoutModule } from "../layout/layout.module";

@NgModule({
  declarations: [AccessibilityComponent],
  imports: [CommonModule, LayoutModule],
})
export class AccessibilityModule {}
