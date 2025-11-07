import { RouterModule } from "@angular/router";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { LinkComponent } from "./link.component";

describe("LinkComponent", () => {
  let spectator: Spectator<LinkComponent>;
  let component: LinkComponent;

  const createComponent = createComponentFactory({
    component: LinkComponent,
    imports: [RouterModule.forRoot([])],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it("should create", () => {
    spectator.detectChanges();

    expect(component).toBeTruthy();
  });
});
