import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StopControlsComponent } from "./stop-controls.component";

describe("StopControlsComponent", () => {
  let component: StopControlsComponent;
  let fixture: ComponentFixture<StopControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StopControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
