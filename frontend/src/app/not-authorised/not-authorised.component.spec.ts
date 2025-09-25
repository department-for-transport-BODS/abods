import { Spectator, createComponentFactory } from "@ngneat/spectator";

import { NotAuthorisedComponent } from "./not-authorised.component";
import { SharedModule } from "../shared/shared.module";
import { LayoutModule } from "../layout/layout.module";

describe("NotAuthorisedComponent", () => {
  let spectator: Spectator<NotAuthorisedComponent>;
  const createComponent = createComponentFactory({
    component: NotAuthorisedComponent,
    imports: [SharedModule, LayoutModule],
  });

  it("should create", () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
