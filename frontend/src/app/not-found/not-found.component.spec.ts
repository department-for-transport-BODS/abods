import { Spectator, createComponentFactory } from "@ngneat/spectator";

import { NotFoundComponent } from "./not-found.component";
import { LayoutModule } from "../layout/layout.module";
import { RouterTestingModule } from "@angular/router/testing";
import { SharedModule } from "../shared/shared.module";

describe("NotFoundComponent", () => {
  let spectator: Spectator<NotFoundComponent>;
  const createComponent = createComponentFactory({
    component: NotFoundComponent,
    imports: [LayoutModule, RouterTestingModule, SharedModule],
  });

  it("should create", () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
