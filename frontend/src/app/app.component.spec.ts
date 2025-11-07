import { RouterModule } from "@angular/router";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { GoogleTagManagerService } from "angular-google-tag-manager";
import { ApolloTestingModule } from "apollo-angular/testing";
import { AppComponent } from "./app.component";
import { LayoutModule } from "./layout/layout.module";
import { SharedModule } from "./shared/shared.module";

describe("AppComponent", () => {
  let spectator: Spectator<AppComponent>;

  const createComponent = createComponentFactory({
    component: AppComponent,
    imports: [
      RouterModule.forRoot([]),
      SharedModule,
      LayoutModule,
      ApolloTestingModule,
    ],
    mocks: [GoogleTagManagerService],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it("should create the app", () => {
    expect(spectator.component).toBeTruthy();
  });
});
