import { Spectator, createComponentFactory } from "@ngneat/spectator";

import { RouterModule } from "@angular/router";
import { LayoutModule } from "../layout/layout.module";
import { SharedModule } from "../shared/shared.module";
import { NotAuthorisedComponent } from "./not-authorised.component";

fdescribe("NotAuthorisedComponent", () => {
  let spectator: Spectator<NotAuthorisedComponent>;
  const createComponent = createComponentFactory({
    component: NotAuthorisedComponent,
    imports: [SharedModule, LayoutModule, RouterModule.forRoot([])],
  });

  it("should create", async () => {
    spectator = createComponent();

    await expect(spectator.component).toBeTruthy();
  });
});
