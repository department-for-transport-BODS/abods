import { Spectator, createComponentFactory } from "@ngneat/spectator";

import { RouterModule } from "@angular/router";
import { LayoutModule } from "../layout/layout.module";
import { SharedModule } from "../shared/shared.module";
import { NotFoundComponent } from "./not-found.component";

fdescribe("NotFoundComponent", () => {
  let spectator: Spectator<NotFoundComponent>;
  const createComponent = createComponentFactory({
    component: NotFoundComponent,
    imports: [LayoutModule, RouterModule.forRoot([]), SharedModule],
  });

  it("should create", async () => {
    spectator = createComponent();

    await expect(spectator.component).toBeTruthy();
  });
});
