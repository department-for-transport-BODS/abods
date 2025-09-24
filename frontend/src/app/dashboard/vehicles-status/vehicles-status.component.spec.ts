import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";

import { RouterModule } from "@angular/router";
import { VehiclesStatusComponent } from "./vehicles-status.component";

describe("VehiclesStatusComponent", () => {
  let spectator: Spectator<VehiclesStatusComponent>;
  let component: VehiclesStatusComponent;

  const createComponent = createComponentFactory({
    component: VehiclesStatusComponent,
    imports: [LayoutModule, SharedModule, RouterModule.forRoot([])],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it("should create", async () => {
    spectator.detectChanges();

    await expect(component).toBeTruthy();
  });
});
