import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Spectator, createComponentFactory } from "@ngneat/spectator";
import { SharedModule } from "../../shared.module";
import { TimeRangeSliderComponent } from "./time-range-slider.component";

describe("TimeRangeSliderComponent", () => {
  let spectator: Spectator<TimeRangeSliderComponent>;
  const createComponent = createComponentFactory({
    component: TimeRangeSliderComponent,
    imports: [SharedModule, FormsModule, RouterModule.forRoot([])],
    detectChanges: false,
  });

  it("should create", () => {
    spectator = createComponent();

    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
