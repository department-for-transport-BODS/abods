import { byText, createComponentFactory, Spectator } from "@ngneat/spectator";

import { MapRecentreButtonComponent } from "./map-recentre-button.component";
import { SvgIconRegistryService } from "angular-svg-icon";

describe("MapRecentreButtonComponent", () => {
  let spectator: Spectator<MapRecentreButtonComponent>;

  const createComponent = createComponentFactory({
    component: MapRecentreButtonComponent,
    imports: [SvgIconRegistryService],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it("should create the component", () => {
    expect(spectator.component).toBeTruthy();
  });

  it("should emit on click", () => {
    spyOn(spectator.component.recentre, "emit");
    spectator.click(byText("Re-centre"));

    expect(spectator.component.recentre.emit).toHaveBeenCalledWith();
  });
});
