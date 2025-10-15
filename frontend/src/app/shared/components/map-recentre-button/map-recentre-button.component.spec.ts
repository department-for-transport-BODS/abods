import { byText, createComponentFactory, Spectator } from "@ngneat/spectator";

import { MapRecentreButtonComponent } from "./map-recentre-button.component";
import {
  AngularSvgIconModule,
  SvgIconRegistryService,
  SvgLoader,
} from "angular-svg-icon";
import { of } from "rxjs";

describe("MapRecentreButtonComponent", () => {
  let spectator: Spectator<MapRecentreButtonComponent>;

  const createComponent = createComponentFactory({
    component: MapRecentreButtonComponent,
    imports: [AngularSvgIconModule],
    providers: [
      SvgIconRegistryService,
      { provide: SvgLoader, useValue: { getSvg: () => of("") } }, // simple mock
    ],
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
